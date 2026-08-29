import type { ProgressSummary } from '../progress/summarizeProgress';
import {
  buildWeeklyTrainingAdaptation,
  type WeeklyTrainingAdaptationProposal,
} from '../training/weeklyAdaptation';

/**
 * Coach-facing training adaptation use case.
 *
 * The training domain owns the single adaptation policy. Coach deliberately
 * delegates to that policy so recommendations shown by Coach and proposals
 * applied from Progress can never drift into different thresholds or actions.
 */
export function adaptTraining(summary: ProgressSummary): WeeklyTrainingAdaptationProposal {
  return buildWeeklyTrainingAdaptation(summary);
}
