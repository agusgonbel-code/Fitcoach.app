import React, { useEffect, useMemo, useState } from 'react';
import { localDate } from '../../data/localRepository';
import { loadProgressPhotos, prepareProgressPhoto, removeProgressPhoto, saveProgressPhoto, type ProgressPhotoRecord, type ProgressPose } from '../../data/progressPhotoRepository';

function useObjectUrl(blob?: Blob): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

function newPhotoId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function ComparePhoto({ photo, label }: { photo?: ProgressPhotoRecord; label: string }) {
  const url = useObjectUrl(photo?.blob);
  return <div className="photo-compare-item"><span className="secondary">{label}</span>{photo && url ? <><img src={url} alt={`${photo.pose} ${photo.localDate}`} /><strong>{photo.localDate}</strong></> : <div className="photo-placeholder">Selecciona una foto</div>}</div>;
}

function sortPhotos(items: ProgressPhotoRecord[]): ProgressPhotoRecord[] {
  return [...items].sort((a, b) => a.localDate.localeCompare(b.localDate) || a.createdAt.localeCompare(b.createdAt));
}

export function PhotoProgress() {
  const [photos, setPhotos] = useState<ProgressPhotoRecord[]>([]);
  const [pose, setPose] = useState<ProgressPose>('front');
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  const refresh = async () => {
    try { setPhotos(await loadProgressPhotos()); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las fotos.'); }
  };
  useEffect(() => { void refresh(); }, []);

  const samePose = useMemo(() => photos.filter(photo => photo.pose === pose), [photos, pose]);
  const left = photos.find(photo => photo.id === leftId);
  const right = photos.find(photo => photo.id === rightId);

  const addPhoto = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await prepareProgressPhoto(file);
      const entry: ProgressPhotoRecord = {
        id: newPhotoId(), localDate: localDate(), pose,
        weightKg: weight.trim() ? Number(weight) : undefined,
        createdAt: new Date().toISOString(), ...prepared,
      };
      await saveProgressPhoto(entry);
      // The entry is already validated and durably committed at this point. Updating
      // state from it avoids an unnecessary immediate IndexedDB structured-clone
      // round trip in WebKit while normal mounts/restores still exercise refresh().
      setPhotos(current => sortPhotos([...current.filter(photo => photo.id !== entry.id), entry]));
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la fotografía.'); }
    finally { setBusy(false); }
  };

  return <section className="section-block">
    <div className="section-heading"><div><p className="eyebrow">FOTOS</p><h2>Comparación corporal</h2></div><strong>{photos.length}</strong></div>
    <p className="secondary">Las fotografías se comprimen y se guardan únicamente en este dispositivo. No se envían a ningún servidor.</p>
    <div className="form-card">
      <div className="form-grid"><label>Vista<select value={pose} onChange={event => setPose(event.target.value as ProgressPose)}><option value="front">Frontal</option><option value="side">Lateral</option><option value="back">Espalda</option></select></label><label>Peso kg opcional<input inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} placeholder="80.2" /></label></div>
      <label className="photo-picker">{busy ? 'Preparando foto…' : 'Añadir fotografía'}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" disabled={busy} onChange={event => { void addPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
      {error && <p className="error" role="alert">{error}</p>}
    </div>

    {samePose.length >= 2 && <div className="form-card"><h3>Comparar {pose === 'front' ? 'frontal' : pose === 'side' ? 'lateral' : 'espalda'}</h3><div className="form-grid"><label>Antes<select value={leftId} onChange={event => setLeftId(event.target.value)}><option value="">Selecciona fecha</option>{samePose.map(photo => <option key={photo.id} value={photo.id}>{photo.localDate}</option>)}</select></label><label>Después<select value={rightId} onChange={event => setRightId(event.target.value)}><option value="">Selecciona fecha</option>{samePose.map(photo => <option key={photo.id} value={photo.id}>{photo.localDate}</option>)}</select></label></div><div className="photo-compare-grid"><ComparePhoto photo={left} label="Antes" /><ComparePhoto photo={right} label="Después" /></div></div>}

    <div className="metric-history">{[...photos].reverse().slice(0, 12).map(photo => <PhotoRow key={photo.id} photo={photo} onRemove={async () => { await removeProgressPhoto(photo.id); await refresh(); if (leftId === photo.id) setLeftId(''); if (rightId === photo.id) setRightId(''); }} />)}</div>
  </section>;
}

function PhotoRow({ photo, onRemove }: { photo: ProgressPhotoRecord; onRemove: () => Promise<void> }) {
  const url = useObjectUrl(photo.blob);
  return <article className="exercise-card photo-row"><div className="photo-thumb">{url && <img src={url} alt={`${photo.pose} ${photo.localDate}`} />}</div><div><strong>{photo.localDate} · {photo.pose === 'front' ? 'Frontal' : photo.pose === 'side' ? 'Lateral' : 'Espalda'}</strong><p className="secondary">{photo.weightKg ? `${photo.weightKg.toFixed(1)} kg · ` : ''}{photo.width}×{photo.height}</p></div><button className="icon-button" aria-label={`Eliminar foto del ${photo.localDate}`} onClick={() => void onRemove()}>×</button></article>;
}
