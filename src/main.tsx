import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './strata-web-stub';
import App from './App';
import { PreferencesProvider } from './state/PreferencesContext';
import './styles/reset.css';
import './styles/theme.css';
import './styles/app.css';
import './styles/ribbon.css';
import './styles/editor.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </StrictMode>,
);
