import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import './store/authStore.js'; // wires axios <-> auth store

(function initTheme() {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('pkbm-theme');
  const dark =
    saved === 'dark' ||
    (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-card !text-foreground !border !border-border',
          duration: 3500,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
