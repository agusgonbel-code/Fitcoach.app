import { beforeEach, describe, expect, it } from 'vitest';
import { activeAcceptedAdaptation, loadAdaptationDecision, saveAdaptationDecision } from './adaptationRepository';
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
  it('persists consent and schedules it for the next microcycle', () => {
    const saved = saveAdaptationDecision(proposal, 'accepted', '2026-08-27');
    expect(saved.effectiveFrom).toBe('2026-08-31');
    expect(loadAdaptationDecision()?.status).toBe('accepted');
  });

  it('does not activate an accepted change before its effective date', () => {
    saveAdaptationDecision(proposal, 'accepted', '2026-08-27');
    expect(activeAcceptedAdaptation('2026-08-30')).toBeNull();
    expect(activeAcceptedAdaptation('2026-08-31')?.action).toBe('deload');
  });

  it('never activates a declined proposal', () => {
    saveAdaptationDecision(proposal, 'declined', '2026-08-27');
    expect(activeAcceptedAdaptation('2026-09-01')).toBeNull();
  });
});
