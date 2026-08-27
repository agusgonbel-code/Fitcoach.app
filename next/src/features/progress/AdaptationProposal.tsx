import React from 'react';
import type { AdaptationDecision } from '../../data/adaptationRepository';
import type { WeeklyTrainingAdaptationProposal } from '../../domain/training/weeklyAdaptation';

const labels: Record<WeeklyTrainingAdaptationProposal['action'], string> = {
  maintain: 'Mantener plan',
  'progress-load': 'Progresar carga',
  'reduce-volume': 'Reducir volumen',
  deload: 'Descarga',
};

function changeText(proposal: WeeklyTrainingAdaptationProposal): string {
  const parts: string[] = [];
  if (proposal.volumePercent) parts.push(`${proposal.volumePercent > 0 ? '+' : ''}${proposal.volumePercent}% volumen`);
  if (proposal.loadPercent) parts.push(`${proposal.loadPercent > 0 ? '+' : ''}${proposal.loadPercent}% carga`);
  if (proposal.deload) parts.push('RIR objetivo más conservador');
  return parts.length ? parts.join(' · ') : 'Sin cambios de volumen ni carga';
}

export function AdaptationProposal({
  proposal,
  decision,
  onAccept,
  onDecline,
}: {
  proposal: WeeklyTrainingAdaptationProposal;
  decision: AdaptationDecision | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const sameDecision = decision?.proposal.id === proposal.id ? decision : null;
  return <article className="coach-card adaptation-card">
    <p className="eyebrow">REVISIÓN SEMANAL · {proposal.confidence.toUpperCase()}</p>
    <h2>FitCoach propone: {labels[proposal.action]}</h2>
    <p><strong>{changeText(proposal)}</strong></p>
    <ul className="adaptation-reasons">{proposal.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
    {sameDecision?.status === 'accepted' ? <div className="coach-inline" role="status"><strong>Cambio aceptado</strong><span>Entrará en vigor el {sameDecision.effectiveFrom}. No modifica la semana en curso.</span></div> : sameDecision?.status === 'declined' ? <div className="coach-inline" role="status"><strong>Plan mantenido</strong><span>Has decidido no aplicar esta propuesta.</span></div> : <div className="adaptation-actions"><button className="primary-action" type="button" onClick={onAccept}>Aceptar cambio</button><button className="secondary-action" type="button" onClick={onDecline}>Mantener plan</button></div>}
    <p className="secondary">Nunca se aplica una adaptación sin tu confirmación. Los cambios aceptados empiezan en el siguiente microciclo.</p>
  </article>;
}
