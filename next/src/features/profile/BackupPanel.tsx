import React, { useRef, useState } from 'react';
import {
  completeBackupFileName,
  createCompleteBackup,
  restoreCompleteBackup,
} from '../../data/completeBackup';
import { deleteAllFitCoachNextData } from '../../data/privacyRepository';

export function BackupPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    if (busy) return;
    setBusy(true); setStatus('Preparando copia completa…');
    try {
      const backup = await createCompleteBackup();
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = completeBackupFileName();
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus(`Copia exportada · ${backup.progressPhotos.length} foto(s) incluidas.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo crear la copia.');
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true); setStatus('Validando copia antes de restaurar…');
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const confirmed = window.confirm('La restauración sustituirá los datos actuales de FitCoach Next por los de esta copia. ¿Continuar?');
      if (!confirmed) {
        setStatus('Restauración cancelada. No se ha modificado ningún dato.');
        return;
      }
      const restored = await restoreCompleteBackup(parsed);
      setStatus(`Copia restaurada · ${restored.progressPhotos.length} foto(s). Recargando datos…`);
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'La copia no es válida o no pudo restaurarse.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const deleteLocalData = async () => {
    if (busy) return;
    const confirmed = window.confirm('Se borrarán de este dispositivo el perfil, entrenamientos, nutrición, progreso, adaptaciones, borradores y fotografías de FitCoach Next. Esta acción no se puede deshacer. ¿Borrar todo?');
    if (!confirmed) {
      setStatus('Borrado cancelado. No se ha modificado ningún dato.');
      return;
    }

    setBusy(true); setStatus('Borrando datos locales de FitCoach Next…');
    try {
      const deleted = await deleteAllFitCoachNextData();
      setStatus(`Datos eliminados · ${deleted.removedStorageKeys} registros locales y ${deleted.removedPhotos} foto(s).`);
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudieron eliminar todos los datos locales.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="form-card backup-panel" aria-labelledby="backup-title">
    <div>
      <p className="eyebrow">DATOS Y PRIVACIDAD</p>
      <h2 id="backup-title">Copia completa</h2>
      <p className="secondary">Incluye perfil, entrenamientos, nutrición, medidas, plan de comidas y fotografías guardadas en este dispositivo.</p>
    </div>
    <div className="backup-actions">
      <button className="secondary-action" type="button" disabled={busy} onClick={exportBackup}>Exportar copia</button>
      <button className="secondary-action" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>Restaurar copia</button>
      <button className="secondary-action danger-action backup-delete" type="button" disabled={busy} onClick={() => void deleteLocalData()}>Borrar todos mis datos</button>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        aria-label="Seleccionar copia de FitCoach Next"
        onChange={event => void importBackup(event.target.files?.[0])}
      />
    </div>
    {status && <p className="secondary" role="status" aria-live="polite">{status}</p>}
  </section>;
}
