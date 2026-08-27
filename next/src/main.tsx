import React from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/tokens.css';
import './shell.css';
import './features/training/training.css';
import './features/progress/progress.css';
import App from './app-next';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
