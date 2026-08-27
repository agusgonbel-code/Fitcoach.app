import type { WeeklyTrainingAdaptationProposal } from '../domain/training/weeklyAdaptation';
import { nextMicrocycleStart, normalizeAdaptation } from '../domain/training/weeklyAdaptation';

const KEY = 'fitcoach_next_training_adaptation_v1';

export type AdaptationDecisionStatus = 'accepted' | 'declined';

export interface AdaptationDecision {
  version: 2;
  proposal: WeeklyTrainingAdaptationProposal;
  status: AdaptationDecisionStatus;
  decidedAt: string;
  effectiveFrom: string;
  effectiveUntil: string;
}

interface StoredAdaptationDecision {
  version?: number;
  proposal?: WeeklyTrainingAdaptationProposal;
  status?: AdaptationDecisionStatus;
  decidedAt?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

function readStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addLocalDays(localDate: string, days: number): string | null {
  const date = parseLocalDate(localDate);
  if (!date || !Number.isInteger(days)) return null;
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function saveAdaptationDecision(proposal: WeeklyTrainingAdaptationProposal, status: AdaptationDecisionStatus, todayLocalDate: string): AdaptationDecision {
  const effectiveFrom = nextMicrocycleStart(todayLocalDate);
  const effectiveUntil = addLocalDays(effectiveFrom, 6);
  if (!effectiveUntil) throw new Error('No se pudo calcular el microciclo de adaptación.');

  const decision: AdaptationDecision = {
    version: 2,
    proposal: normalizeAdaptation(proposal),
    status,
    decidedAt: new Date().toISOString(),
    effectiveFrom,
    effectiveUntil,
  };
  readStorage()?.setItem(KEY, JSON.stringify(decision));
  return decision;
}

export function loadAdaptationDecision(): AdaptationDecision | null {
  const storage = readStorage();
  const raw = storage?.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAdaptationDecision;
    const legacyVersion = parsed.version === 1;
    if ((!legacyVersion && parsed.version !== 2) || !parsed.proposal || (parsed.status !== 'accepted' && parsed.status !== 'declined') || typeof parsed.effectiveFrom !== 'string') return null;

    const effectiveUntil = typeof parsed.effectiveUntil === 'string'
      ? parsed.effectiveUntil
      : addLocalDays(parsed.effectiveFrom, 6);
    if (!effectiveUntil) return null;

    const decision: AdaptationDecision = {
      version: 2,
      proposal: normalizeAdaptation(parsed.proposal),
      status: parsed.status,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : new Date().toISOString(),
      effectiveFrom: parsed.effectiveFrom,
      effectiveUntil,
    };

    if (legacyVersion) storage?.setItem(KEY, JSON.stringify(decision));
    return decision;
  } catch { return null; }
}

export function activeAcceptedAdaptation(todayLocalDate: string): WeeklyTrainingAdaptationProposal | null {
  const decision = loadAdaptationDecision();
  if (!decision || decision.status !== 'accepted') return null;
  if (todayLocalDate < decision.effectiveFrom || todayLocalDate > decision.effectiveUntil) return null;
  return decision.proposal;
}

export function clearAdaptationDecision(): void {
  readStorage()?.removeItem(KEY);
}
