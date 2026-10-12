import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import DevPhoneFrame, { isDevPhoneFrameHost, PHONE_FRAME_WINDOW_NAME } from '@/components/DevPhoneFrame';
import './index.css';
import { bootPlaceVault } from '@/lib/placeVault';

const showPhoneFrame = isDevPhoneFrameHost();
if (!showPhoneFrame) {
  if (window.name === PHONE_FRAME_WINDOW_NAME) {
    document.documentElement.classList.add('phone-preview-inner');
  }
  const bootVault = () => { void bootPlaceVault(); };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(bootVault, { timeout: 1800 });
  } else {
    window.setTimeout(bootVault, 400);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60_000,
      gcTime: Infinity,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  showPhoneFrame ? (
    <DevPhoneFrame />
  ) : (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  ),
);
