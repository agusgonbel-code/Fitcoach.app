(() => {
  'use strict';

  const SCHEMA = 'fitcoach-backup';
  const SCHEMA_VERSION = 1;
  const APP_VERSION = '3.4.2';
  const DB_NAME = 'v34photos2';
  const STORE_NAME = 'p';
  const MAX_BACKUP_BYTES = 120 * 1024 * 1024;
  const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
  const MAX_TOTAL_PHOTO_BYTES = 75 * 1024 * 1024;
  const MAX_PHOTOS = 500;
  const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
  const STORAGE_KEYS = [
    'profile', 'targets', 'workouts', 'meals', 'metrics',
    'fitcoach_active_plan_v33', 'fitcoach_priorities_v33',
    'fitcoach_menu_30_v33', 'v34meas'
  ];

  const fail = message => { throw new Error(message); };

  function validateJson(value, depth = 0) {
    if (depth > 8) fail('La copia contiene datos demasiado anidados.');
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail('La copia contiene un número no válido.');
      return;
    }
    if (typeof value === 'string') {
      if (value.length > 10000) fail('La copia contiene un texto demasiado largo.');
      return;
    }
    if (Array.isArray(value)) {
      if (value.length > 20000) fail('La copia contiene demasiados registros.');
      value.forEach(item => validateJson(item, depth + 1));
      return;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length > 200) fail('La copia contiene un objeto demasiado grande.');
      for (const [key, item] of entries) {
        if (key === '__proto__' || key === 'prototype' || key === 'constructor' || key.length > 100) {
          fail('La copia contiene una clave no permitida.');
        }
        validateJson(item, depth + 1);
      }
      return;
    }
    fail('La copia contiene un tipo de dato no permitido.');
  }

  function dataUrlBytes(dataUrl) {
    if (typeof dataUrl !== 'string') fail('Una fotografía no contiene datos válidos.');
    const match = /^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match) fail('Una fotografía usa un formato de copia no permitido.');
    const padding = match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0;
    return { type: match[1], bytes: Math.floor(match[2].length * 3 / 4) - padding };
  }

  function validateBackupPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('La copia no es válida.');
    if (payload.schema !== SCHEMA || payload.schemaVersion !== SCHEMA_VERSION) {
      fail('Esta copia no pertenece a una versión compatible de FitCoach.');
    }
    if (!payload.local || typeof payload.local !== 'object' || Array.isArray(payload.local)) {
      fail('La copia no contiene los datos de FitCoach.');
    }
    for (const key of Object.keys(payload.local)) {
      if (!STORAGE_KEYS.includes(key)) fail('La copia contiene una sección no permitida.');
      validateJson(payload.local[key]);
    }
    if (!Array.isArray(payload.photos) || payload.photos.length > MAX_PHOTOS) {
      fail('La copia contiene demasiadas fotografías.');
    }
    let totalPhotoBytes = 0;
    const ids = new Set();
    for (const photo of payload.photos) {
      if (!photo || typeof photo !== 'object' || Array.isArray(photo)) fail('Hay una fotografía no válida.');
      if (typeof photo.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(photo.id) || ids.has(photo.id)) {
        fail('Hay un identificador de fotografía no válido o repetido.');
      }
      ids.add(photo.id);
      if (typeof photo.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(photo.date)) {
        fail('Hay una fecha de fotografía no válida.');
      }
      if (typeof photo.pose !== 'string' || photo.pose.length > 50) fail('Hay una pose no válida.');
      const encoded = dataUrlBytes(photo.dataUrl);
      if (encoded.bytes <= 0 || encoded.bytes > MAX_PHOTO_BYTES) fail('Una fotografía supera el límite seguro.');
      totalPhotoBytes += encoded.bytes;
      if (totalPhotoBytes > MAX_TOTAL_PHOTO_BYTES) fail('Las fotografías de la copia ocupan demasiado.');
      for (const field of ['originalBytes', 'storedBytes']) {
        if (photo[field] != null && (!Number.isFinite(photo[field]) || photo[field] < 0 || photo[field] > MAX_PHOTO_BYTES)) {
          fail('Los metadatos de una fotografía no son válidos.');
        }
      }
    }
    return { photoCount: payload.photos.length, totalPhotoBytes };
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getPhotos() {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }

  async function replacePhotos(records) {
    const database = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        records.forEach(record => store.put(record));
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('La restauración de fotos fue cancelada.'));
      });
    } finally {
      database.close();
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const { type } = dataUrlBytes(dataUrl);
    const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type });
  }

  async function createBackupPayload() {
    const local = {};
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try { local[key] = JSON.parse(raw); }
        catch { fail(`No se puede exportar ${key}: contiene datos dañados.`); }
      }
    }
    const storedPhotos = await getPhotos();
    if (storedPhotos.length > MAX_PHOTOS) fail('Hay demasiadas fotografías para una sola copia.');
    const photos = [];
    let total = 0;
    for (const photo of storedPhotos) {
      if (!(photo.blob instanceof Blob) || !PHOTO_TYPES.has(photo.blob.type) || photo.blob.size > MAX_PHOTO_BYTES) {
        fail('Hay una fotografía antigua que no se puede exportar de forma segura.');
      }
      total += photo.blob.size;
      if (total > MAX_TOTAL_PHOTO_BYTES) fail('Las fotografías superan 75 MB; elimina copias innecesarias antes de exportar.');
      photos.push({
        id: String(photo.id), date: String(photo.date), pose: String(photo.pose || ''),
        originalBytes: Number.isFinite(photo.originalBytes) ? photo.originalBytes : photo.blob.size,
        storedBytes: photo.blob.size, dataUrl: await blobToDataUrl(photo.blob)
      });
    }
    const payload = {
      schema: SCHEMA, schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(), local, photos
    };
    validateBackupPayload(payload);
    return payload;
  }

  async function restoreBackupPayload(payload) {
    validateBackupPayload(payload);
    const restoredPhotos = payload.photos.map(photo => ({
      id: photo.id, date: photo.date, pose: photo.pose, blob: dataUrlToBlob(photo.dataUrl),
      originalBytes: photo.originalBytes ?? dataUrlBytes(photo.dataUrl).bytes,
      storedBytes: photo.storedBytes ?? dataUrlBytes(photo.dataUrl).bytes
    }));
    const previousLocal = new Map(STORAGE_KEYS.map(key => [key, localStorage.getItem(key)]));
    const previousPhotos = await getPhotos();
    try {
      for (const key of STORAGE_KEYS) {
        if (Object.hasOwn(payload.local, key)) localStorage.setItem(key, JSON.stringify(payload.local[key]));
        else localStorage.removeItem(key);
      }
      await replacePhotos(restoredPhotos);
    } catch (error) {
      for (const [key, raw] of previousLocal) {
        try { raw === null ? localStorage.removeItem(key) : localStorage.setItem(key, raw); } catch {}
      }
      try { await replacePhotos(previousPhotos); } catch {}
      throw new Error('No se pudo restaurar la copia; se han recuperado los datos anteriores.', { cause: error });
    }
    return { photoCount: restoredPhotos.length };
  }

  function setStatus(message, error = false) {
    const status = document.getElementById('backupStatus');
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? '#ff8f8f' : '';
  }

  async function exportBackup() {
    const button = document.getElementById('backup');
    if (button) button.disabled = true;
    setStatus('Preparando datos y fotografías…');
    try {
      const payload = await createBackupPayload();
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (blob.size > MAX_BACKUP_BYTES) fail('La copia supera 120 MB y no es segura para este dispositivo.');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitcoach-backup-${APP_VERSION}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(`Copia exportada · ${payload.photos.length} fotos`);
    } catch (error) {
      setStatus(error?.message || 'No se pudo crear la copia.', true);
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function importBackup(file) {
    if (!file || file.size <= 0 || file.size > MAX_BACKUP_BYTES) {
      setStatus('Selecciona una copia JSON de FitCoach de hasta 120 MB.', true);
      return;
    }
    setStatus('Validando y restaurando la copia…');
    try {
      const payload = JSON.parse(await file.text());
      const result = await restoreBackupPayload(payload);
      setStatus(`Copia restaurada · ${result.photoCount} fotos. Recargando…`);
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      setStatus(error?.message || 'La copia no es válida o está dañada.', true);
    }
  }

  function init() {
    const backup = document.getElementById('backup');
    if (!backup || document.getElementById('restoreBackup')) return;
    backup.textContent = 'Exportar copia completa';
    backup.onclick = exportBackup;
    const input = document.createElement('input');
    input.id = 'backupFile';
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.hidden = true;
    input.onchange = () => { importBackup(input.files?.[0]); input.value = ''; };
    const restore = document.createElement('button');
    restore.id = 'restoreBackup';
    restore.type = 'button';
    restore.className = 'secondary';
    restore.textContent = 'Restaurar copia';
    restore.onclick = () => input.click();
    const status = document.createElement('div');
    status.id = 'backupStatus';
    status.className = 'muted';
    backup.after(input, restore, status);
  }

  globalThis.FitCoachBackup = {
    SCHEMA, SCHEMA_VERSION, MAX_BACKUP_BYTES, MAX_PHOTO_BYTES, MAX_TOTAL_PHOTO_BYTES,
    STORAGE_KEYS, dataUrlBytes, validateJson, validateBackupPayload,
    createBackupPayload, restoreBackupPayload
  };

  if (typeof document !== 'undefined') {
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', init, { once: true })
      : init();
  }
})();
