import type { CoachInsight } from '../models';
import type { ProgressSummary } from '../progress/summarizeProgress';

export function buildCoachInsight(summary: ProgressSummary, completedToday: boolean): CoachInsight {
  if (summary.completedWorkouts7d === 0) {
    return {
      id: 'coach-start', title: 'Empieza por una sesión completa',
      observation: 'Todavía no hay entrenamientos completos esta semana.',
      recommendation: 'Completa el entrenamiento de hoy y registra RIR para que FitCoach pueda aprender de tu rendimiento.',
      confidence: 'high', actionLabel: 'Entrenar',
    };
  }

  if (summary.trainingAdherence < 0.6) {
    return {
      id: 'coach-adherence', title: 'Prioriza la adherencia',
      observation: `Has completado ${summary.completedWorkouts7d} de ${summary.plannedWorkouts7d} sesiones previstas en los últimos 7 días.`,
      recommendation: 'No aumentaría volumen todavía. Completa primero más sesiones del plan y vuelve a evaluar al final de la semana.',
      confidence: 'high', actionLabel: 'Ver plan',
    };
  }

  if (summary.averageRir7d !== null && summary.averageRir7d < 1) {
    return {
      id: 'coach-fatigue', title: 'Estás entrenando muy cerca del límite',
      observation: `Tu RIR medio de los últimos 7 días es ${summary.averageRir7d.toFixed(1)}.`,
      recommendation: 'Mantén la carga y deja aproximadamente 1–3 RIR antes de intentar progresar de nuevo.',
      confidence: summary.totalSets7d >= 8 ? 'high' : 'medium', actionLabel: 'Revisar entrenamiento',
    };
  }

  if (summary.nutritionAdherence === null) {
    return {
      id: 'coach-nutrition-data', title: completedToday ? 'Completa el registro del día' : 'Necesito más datos nutricionales',
      observation: `Hay ${summary.nutritionLoggingDays7d} día(s) con registro nutricional reciente.`,
      recommendation: 'Registra al menos 4 días completos antes de que FitCoach proponga cambios de calorías.',
      confidence: 'high', actionLabel: 'Registrar comida',
    };
  }

  if (summary.nutritionAdherence < 0.75) {
    return {
      id: 'coach-nutrition-adherence', title: 'Mejora la consistencia antes de ajustar calorías',
      observation: `La adherencia energética reciente es aproximadamente del ${Math.round(summary.nutritionAdherence * 100)}%.`,
      recommendation: 'Mantendría el objetivo actual y trabajaría primero en acercar el registro diario a las calorías planificadas.',
      confidence: 'medium', actionLabel: 'Ver nutrición',
    };
  }

  return {
    id: 'coach-stable', title: 'Semana estable',
    observation: `Adherencia de entrenamiento ${Math.round(summary.trainingAdherence * 100)}% y ${summary.totalSets7d} series registradas.`,
    recommendation: 'Mantén el plan. Usa la recomendación específica de cada ejercicio para progresar carga o repeticiones.',
    confidence: summary.completedWorkouts7d >= 3 ? 'high' : 'medium', actionLabel: 'Continuar plan',
  };
}
