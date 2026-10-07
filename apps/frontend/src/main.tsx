import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiProvider } from './api/api-context';
import { createHttpDashboardApi } from './api/dashboard-api';
import { DashboardPage } from './pages/DashboardPage';
import './main.css';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider api={createHttpDashboardApi(apiUrl)}>
      <DashboardPage />
    </ApiProvider>
  </StrictMode>,
);
