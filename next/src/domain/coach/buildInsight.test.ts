import { describe, expect, it } from 'vitest';
import { buildCoachInsight } from './buildInsight';
import type { ProgressSummary } from '../progress/summarizeProgress';

const base: ProgressSummary={completedWorkouts7d:4,plannedWorkouts7d:4,trainingAdherence:1,totalSets7d:20,volumeLoad7d:12000,averageRir7d:2,nutritionLoggingDays7d:5,nutritionAdherence:.9};

describe('buildCoachInsight',()=>{
  it('prioritizes low adherence before progression',()=>{
    const insight=buildCoachInsight({...base,completedWorkouts7d:1,trainingAdherence:.25},false);
    expect(insight.id).toBe('coach-adherence');
  });
  it('flags repeated near-failure effort',()=>{
    const insight=buildCoachInsight({...base,averageRir7d:.5},true);
    expect(insight.id).toBe('coach-fatigue');
    expect(insight.confidence).toBe('high');
  });
  it('does not change nutrition with insufficient logging',()=>{
    const insight=buildCoachInsight({...base,nutritionLoggingDays7d:3,nutritionAdherence:null},true);
    expect(insight.id).toBe('coach-nutrition-data');
  });
});
