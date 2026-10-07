import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiProvider } from './api/api-context';
import { createHttpDashboardApi } from './api/dashboard-api';
import { CaptivePortalPage, isPortalPath } from './pages/CaptivePortalPage';
import { DashboardPage } from './pages/DashboardPage';
import './main.css';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider api={createHttpDashboardApi(apiUrl)}>
      {isPortalPath(window.location.pathname) ? <CaptivePortalPage /> : <DashboardPage />}
    </ApiProvider>
  </StrictMode>,
);
