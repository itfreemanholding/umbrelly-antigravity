import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Fetch Interceptor to inject the active PostgreSQL Project ID
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const projectId = localStorage.getItem('activeProjectId');
  
  if (projectId && typeof resource === 'string' && resource.startsWith('/api')) {
    config = config || {};
    config.headers = {
      ...config.headers,
      'x-project-id': projectId
    };
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
