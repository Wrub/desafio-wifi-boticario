import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApiProvider, PortalApiProvider } from './api/api-context';
import { createHttpDashboardApi } from './api/dashboard-api';
import { createHttpPortalApi } from './api/portal-api';
import { CaptivePortalPage, isPortalPath } from './pages/CaptivePortalPage';
import { DashboardPage } from './pages/DashboardPage';
import './main.css';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPortalPath(window.location.pathname) ? (
      <PortalApiProvider api={createHttpPortalApi(apiUrl)}>
        <CaptivePortalPage />
      </PortalApiProvider>
    ) : (
      <DashboardApiProvider api={createHttpDashboardApi(apiUrl)}>
        <DashboardPage />
      </DashboardApiProvider>
    )}
  </StrictMode>,
);
