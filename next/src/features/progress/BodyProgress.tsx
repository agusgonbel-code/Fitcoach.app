import React, { useMemo, useState } from 'react';
import type { BodyMetric } from '../../domain/models';
import { localDate, removeBodyMetric, saveBodyMetric } from '../../data/localRepository';

interface BodyProgressProps {
  metrics: BodyMetric[];
  onChange: () => void;
}

function trendText(metrics: BodyMetric[]): string {
  if (metrics.length < 2) return 'Añade al menos dos registros para ver una tendencia.';
  const first = metrics[0];
  const last = metrics.at(-1)!;
  const change = last.weightKg - first.weightKg;
  if (Math.abs(change) < 0.05) return `Peso estable entre ${first.weightKg.toFixed(1)} y ${last.weightKg.toFixed(1)} kg.`;
  const direction = change > 0 ? 'Subida' : 'Bajada';
  return `${direction} de ${Math.abs(change).toFixed(1)} kg desde el primer registro guardado.`;
}

export function BodyProgress({ metrics, onChange }: BodyProgressProps) {
  const latest = metrics.at(-1);
  const [weight, setWeight] = useState(latest?.weightKg.toString() ?? '');
  const [waist, setWaist] = useState(latest?.waistCm?.toString() ?? '');
  const [bodyFat, setBodyFat] = useState(latest?.bodyFatPct?.toString() ?? '');
  const [error, setError] = useState('');
  const trend = useMemo(() => trendText(metrics), [metrics]);

  const save = () => {
    const entry: BodyMetric = {
      id: crypto.randomUUID(),
      localDate: localDate(),
      weightKg: Number(weight),
      waistCm: waist.trim() ? Number(waist) : undefined,
      bodyFatPct: bodyFat.trim() ? Number(bodyFat) : undefined,
      createdAt: new Date().toISOString(),
    };
    try {
      saveBodyMetric(entry);
      setError('');
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la medida.');
    }
  };

  return <section className="section-block">
    <div className="section-heading"><div><p className="eyebrow">CUERPO</p><h2>Medidas corporales</h2></div>{latest && <strong>{latest.weightKg.toFixed(1)} kg</strong>}</div>
    <p className="secondary">{trend}</p>
    <div className="form-card">
      <div className="form-grid">
        <label>Peso kg<input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="80.5" /></label>
        <label>Cintura cm<input inputMode="decimal" value={waist} onChange={(event) => setWaist(event.target.value)} placeholder="Opcional" /></label>
        <label>Grasa %<input inputMode="decimal" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="Opcional" /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary-action" onClick={save}>Guardar medida de hoy</button>
    </div>
    <div className="metric-history">
      {[...metrics].reverse().slice(0, 8).map((metric) => <article className="exercise-card" key={metric.id}>
        <div className="hero-row"><div><strong>{metric.localDate}</strong><p className="secondary">{metric.weightKg.toFixed(1)} kg{metric.waistCm !== undefined ? ` · cintura ${metric.waistCm.toFixed(1)} cm` : ''}{metric.bodyFatPct !== undefined ? ` · grasa ${metric.bodyFatPct.toFixed(1)}%` : ''}</p></div><button className="icon-button" aria-label={`Eliminar medida del ${metric.localDate}`} onClick={() => { removeBodyMetric(metric.id); onChange(); }}>×</button></div>
      </article>)}
    </div>
  </section>;
}
