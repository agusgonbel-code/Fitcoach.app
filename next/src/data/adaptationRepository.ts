import type { WeeklyTrainingAdaptationProposal } from '../domain/training/weeklyAdaptation';
import { nextMicrocycleStart, normalizeAdaptation } from '../domain/training/weeklyAdaptation';

const KEY = 'fitcoach_next_training_adaptation_v1';

export type AdaptationDecisionStatus = 'accepted' | 'declined';

export interface AdaptationDecision {
  version: 1;
  proposal: WeeklyTrainingAdaptationProposal;
  status: AdaptationDecisionStatus;
  decidedAt: string;
  effectiveFrom: string;
}

function readStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function saveAdaptationDecision(proposal: WeeklyTrainingAdaptationProposal, status: AdaptationDecisionStatus, todayLocalDate: string): AdaptationDecision {
  const decision: AdaptationDecision = {
    version: 1,
    proposal: normalizeAdaptation(proposal),
    status,
    decidedAt: new Date().toISOString(),
    effectiveFrom: nextMicrocycleStart(todayLocalDate),
  };
  readStorage()?.setItem(KEY, JSON.stringify(decision));
  return decision;
}

export function loadAdaptationDecision(): AdaptationDecision | null {
  const raw = readStorage()?.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdaptationDecision>;
    if (parsed.version !== 1 || !parsed.proposal || (parsed.status !== 'accepted' && parsed.status !== 'declined') || typeof parsed.effectiveFrom !== 'string') return null;
    return { ...parsed, proposal: normalizeAdaptation(parsed.proposal as WeeklyTrainingAdaptationProposal) } as AdaptationDecision;
  } catch { return null; }
}

export function activeAcceptedAdaptation(todayLocalDate: string): WeeklyTrainingAdaptationProposal | null {
  const decision = loadAdaptationDecision();
  if (!decision || decision.status !== 'accepted' || decision.effectiveFrom > todayLocalDate) return null;
  return decision.proposal;
}

export function clearAdaptationDecision(): void {
  readStorage()?.removeItem(KEY);
}
