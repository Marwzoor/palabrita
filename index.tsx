import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { recoverAnswer } from './services/answerStorage.mjs';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateServiceWorker(true).then(() => {
      window.location.reload();
    });
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Recover before any component reads or writes learner progress.
try { recoverAnswer(localStorage); } catch (error) {
  rootElement.textContent = 'Ditt senaste svar är sparat men kunde inte läsas in. Frigör lagringsutrymme och ladda om sidan.';
  throw error;
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
