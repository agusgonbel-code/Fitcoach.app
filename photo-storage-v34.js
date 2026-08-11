(() => {
  'use strict';

  const MAX_INPUT_BYTES = 25 * 1024 * 1024;
  const MAX_STORED_BYTES = 5 * 1024 * 1024;
  const SUPPORTED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'
  ]);
  const SUPPORTED_EXTENSION = /\.(?:jpe?g|png|webp|heic|heif)$/i;

  function isSupportedPhoto(file, maxBytes = MAX_INPUT_BYTES) {
    if (!file || !Number.isFinite(file.size) || file.size <= 0 ||
        !Number.isFinite(maxBytes) || maxBytes <= 0 || file.size > maxBytes) {
      return false;
    }
    const type = String(file.type ?? '').split(';')[0].trim().toLowerCase();
    return SUPPORTED_TYPES.has(type) || SUPPORTED_EXTENSION.test(String(file.name ?? ''));
  }

  function fittedSize(width, height, maxSide = 1600) {
    if (![width, height, maxSide].every(Number.isFinite) ||
        width <= 0 || height <= 0 || maxSide <= 0) {
      throw new Error('Dimensiones de foto no válidas');
    }
    const scale = Math.min(1, maxSide / Math.max(width, height));
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  function loadPhoto(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      const done = () => URL.revokeObjectURL(url);
      image.onload = () => { done(); resolve(image); };
      image.onerror = () => { done(); reject(new Error('Safari no pudo leer esta fotografía.')); };
      image.src = url;
    });
  }

  async function compressPhoto(file, options = {}) {
    if (!isSupportedPhoto(file)) {
      throw new Error('Usa una foto JPG, PNG, WebP o HEIC/HEIF de hasta 25 MB.');
    }
    const image = await loadPhoto(file);
    const size = fittedSize(image.naturalWidth, image.naturalHeight, options.maxSide ?? 1600);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        value => value ? resolve(value) : reject(new Error('No se pudo comprimir la fotografía.')),
        'image/jpeg',
        options.quality ?? 0.84
      );
    });
    canvas.width = canvas.height = 1;
    if (blob.size > MAX_STORED_BYTES) {
      throw new Error('La fotografía sigue siendo demasiado grande después de comprimirla.');
    }
    return blob;
  }

  globalThis.FitCoachPhoto = {
    MAX_INPUT_BYTES, MAX_STORED_BYTES, isSupportedPhoto, fittedSize, compressPhoto
  };
})();
