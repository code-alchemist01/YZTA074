import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // BrowserRouter'ı import ediyoruz

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* Uygulamayı BrowserRouter ile sarmalıyoruz */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);