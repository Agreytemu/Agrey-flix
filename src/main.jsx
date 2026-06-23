import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { WatchlistProvider } from './context/WatchlistContext.jsx';
import { ProfileProvider } from './context/ProfileContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, 
    },
  },
});

// React Query Resilience: Refresh stale lists automatically when the app comes back online
window.addEventListener('online', () => {
  queryClient.invalidateQueries(); 
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <ProfileProvider>
            <WatchlistProvider>
              <App />
            </WatchlistProvider>
          </ProfileProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);

// Register Service Worker for Progressive Web App (PWA) support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('AgreyFlix Service Worker registered successfully on scope:', registration.scope);
      })
      .catch((error) => {
        console.error('AgreyFlix Service Worker registration failed:', error);
      });
  });
}
