import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileStudio } from './MobileStudio';
import './mobile-studio.css';
import '../index.css';

const rootEl = document.getElementById('mobile-studio-root');
if (!rootEl) throw new Error('Root element #mobile-studio-root not found.');

createRoot(rootEl).render(
  <StrictMode>
    <MobileStudio />
  </StrictMode>,
);
