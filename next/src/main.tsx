import React from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/tokens.css';
import './shell.css';

const summary = {
  workout: { title: 'Torso A', minutes: 47, exercises: 6 },
  nutrition: { consumed: 1420, target: 2450, protein: 112, proteinTarget: 165 },
  coach: 'Mantén la carga y busca una repetición más con 1–3 RIR.'
};

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">HOY</p>
          <h1>Buenos días</h1>
        </div>
        <button className="icon-button" aria-label="Abrir perfil">AG</button>
      </header>

      <section className="hero-card" aria-labelledby="today-workout">
        <p className="eyebrow">TU ENTRENAMIENTO</p>
        <div className="hero-row">
          <div>
            <h2 id="today-workout">{summary.workout.title}</h2>
            <p>{summary.workout.minutes} min · {summary.workout.exercises} ejercicios</p>
          </div>
          <span className="status-pill">Listo</span>
        </div>
        <button className="primary-action">Empezar entrenamiento</button>
      </section>

      <section className="section-block" aria-labelledby="nutrition-title">
        <div className="section-heading">
          <h2 id="nutrition-title">Nutrición</h2>
          <span>{summary.nutrition.consumed} / {summary.nutrition.target} kcal</span>
        </div>
        <progress value={summary.nutrition.consumed} max={summary.nutrition.target} />
        <p className="secondary">Proteína {summary.nutrition.protein} / {summary.nutrition.proteinTarget} g</p>
      </section>

      <section className="coach-card" aria-labelledby="coach-title">
        <p className="eyebrow">COACH</p>
        <h2 id="coach-title">Siguiente mejor acción</h2>
        <p>{summary.coach}</p>
      </section>

      <nav className="tabbar" aria-label="Navegación principal">
        <button className="active">Hoy</button>
        <button>Entrenar</button>
        <button>Nutrición</button>
        <button>Progreso</button>
        <button>Perfil</button>
      </nav>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
