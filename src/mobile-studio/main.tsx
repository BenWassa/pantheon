import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
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

// Register the shared service worker so the studio is offline-capable and
// installable on its own (the reader registers the same worker via PWAPrompt).
// The studio is a tool: take updates silently on the next launch, no prompt.
registerSW({ immediate: true });
