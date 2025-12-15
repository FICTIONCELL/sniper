import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { DeviceProvider } from '@/contexts/DeviceContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import App from './App.tsx'
import './index.css'

import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TranslationProvider>
          <DeviceProvider>
            <SubscriptionProvider>
              <App />
            </SubscriptionProvider>
          </DeviceProvider>
        </TranslationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
