import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Studio } from './Studio';
import '../index.css';

const rootEl = document.getElementById('studio-root');
if (!rootEl) throw new Error('Root element #studio-root not found.');

createRoot(rootEl).render(
  <StrictMode>
    <Studio />
  </StrictMode>,
);
