import { beforeEach, describe, expect, it } from 'vitest';
import { activeAcceptedAdaptation, addLocalDays, loadAdaptationDecision, saveAdaptationDecision } from './adaptationRepository';
import type { WeeklyTrainingAdaptationProposal } from '../domain/training/weeklyAdaptation';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const proposal: WeeklyTrainingAdaptationProposal = {
  id: 'adapt-fatigue', action: 'deload', volumePercent: -15, loadPercent: -5,
  deload: true, confidence: 'high', reasons: ['fatiga'], requiresConfirmation: true,
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
});

describe('adaptationRepository', () => {
  it('persists consent only for the next microcycle', () => {
    const saved = saveAdaptationDecision(proposal, 'accepted', '2026-08-27');
    expect(saved.effectiveFrom).toBe('2026-08-31');
    expect(saved.effectiveUntil).toBe('2026-09-06');
    expect(loadAdaptationDecision()?.status).toBe('accepted');
  });

  it('does not activate an accepted change before its effective date', () => {
    saveAdaptationDecision(proposal, 'accepted', '2026-08-27');
    expect(activeAcceptedAdaptation('2026-08-30')).toBeNull();
    expect(activeAcceptedAdaptation('2026-08-31')?.action).toBe('deload');
  });

  it('expires an accepted adaptation after one microcycle', () => {
    saveAdaptationDecision(proposal, 'accepted', '2026-08-27');
    expect(activeAcceptedAdaptation('2026-09-06')?.action).toBe('deload');
    expect(activeAcceptedAdaptation('2026-09-07')).toBeNull();
  });

  it('never activates a declined proposal', () => {
    saveAdaptationDecision(proposal, 'declined', '2026-08-27');
    expect(activeAcceptedAdaptation('2026-09-01')).toBeNull();
  });

  it('migrates an existing v1 decision to a bounded microcycle', () => {
    localStorage.setItem('fitcoach_next_training_adaptation_v1', JSON.stringify({
      version: 1,
      proposal,
      status: 'accepted',
      decidedAt: '2026-08-27T08:00:00.000Z',
      effectiveFrom: '2026-08-31',
    }));
    const decision = loadAdaptationDecision();
    expect(decision?.version).toBe(2);
    expect(decision?.effectiveUntil).toBe('2026-09-06');
    expect(JSON.parse(localStorage.getItem('fitcoach_next_training_adaptation_v1') ?? '{}').version).toBe(2);
  });

  it('rejects impossible civil dates instead of normalizing them silently', () => {
    expect(addLocalDays('2026-02-31', 6)).toBeNull();
    expect(activeAcceptedAdaptation('2026-02-31')).toBeNull();
  });

  it('rejects a persisted decision with a manipulated activation window', () => {
    const raw = JSON.stringify({
      version: 2,
      proposal,
      status: 'accepted',
      decidedAt: '2026-08-27T08:00:00.000Z',
      effectiveFrom: '2026-08-31',
      effectiveUntil: '2026-09-30',
    });
    localStorage.setItem('fitcoach_next_training_adaptation_v1', raw);
    expect(loadAdaptationDecision()).toBeNull();
    expect(localStorage.getItem('fitcoach_next_training_adaptation_v1')).toBe(raw);
  });

  it('rejects invalid decision timestamps without overwriting the raw record', () => {
    const raw = JSON.stringify({
      version: 2,
      proposal,
      status: 'accepted',
      decidedAt: 'not-a-timestamp',
      effectiveFrom: '2026-08-31',
      effectiveUntil: '2026-09-06',
    });
    localStorage.setItem('fitcoach_next_training_adaptation_v1', raw);
    expect(loadAdaptationDecision()).toBeNull();
    expect(localStorage.getItem('fitcoach_next_training_adaptation_v1')).toBe(raw);
  });

  it('adds days using local civil dates across month boundaries', () => {
    expect(addLocalDays('2026-08-31', 6)).toBe('2026-09-06');
    expect(addLocalDays('invalid', 6)).toBeNull();
  });
});
