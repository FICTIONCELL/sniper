import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { GoogleDriveProvider } from "@/contexts/GoogleDriveContext";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Reserves from "./pages/Reserves";
import Contractors from "./pages/Contractors";
import ResolveReserves from "./pages/ResolveReserves";
import Receptions from "./pages/Receptions";
import Tasks from "./pages/Tasks";
import Planning from "./pages/Planning";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import CompactReserves from "./pages/CompactReserves";
import CompactDashboard from "./pages/CompactDashboard";
import TestPV from "./pages/TestPV";
import Buildings from "./pages/Buildings";
import { Documents } from "./pages/Documents";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { MotionWrapper } from "@/components/MotionWrapper";
import { useState, useEffect } from "react";

import { Capacitor } from '@capacitor/core';

const queryClient = new QueryClient();

import { GOOGLE_CLIENT_ID } from "./config";

const App = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Apply zoom only on native platform (Android)
    if (Capacitor.isNativePlatform()) {
      document.body.style.zoom = "0.8";
    }

    const storedUser = localStorage.getItem('sniper_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: any) => {
    localStorage.setItem('sniper_user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <GoogleDriveProvider>
              <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* Protected Admin Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <NotificationProvider>
                        <Admin />
                      </NotificationProvider>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Compact Route */}
                <Route
                  path="/compact"
                  element={
                    <ProtectedRoute>
                      <NotificationProvider>
                        <MotionWrapper>
                          <CompactDashboard />
                        </MotionWrapper>
                      </NotificationProvider>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Main Routes */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                          <Route path="/" element={<MotionWrapper><Dashboard /></MotionWrapper>} />
                          <Route path="/projects" element={<MotionWrapper><Projects /></MotionWrapper>} />
                          <Route path="/projects/:id" element={<MotionWrapper><ProjectDetail /></MotionWrapper>} />
                          <Route path="/reserves" element={<MotionWrapper><Reserves /></MotionWrapper>} />
                          <Route path="/reserves/compact" element={<MotionWrapper><CompactReserves /></MotionWrapper>} />
                          <Route path="/contractors" element={<MotionWrapper><Contractors /></MotionWrapper>} />
                          <Route path="/resolve-reserves" element={<MotionWrapper><ResolveReserves /></MotionWrapper>} />
                          <Route path="/receptions" element={<MotionWrapper><Receptions /></MotionWrapper>} />
                          <Route path="/tasks" element={<MotionWrapper><Tasks /></MotionWrapper>} />
                          <Route path="/planning" element={<MotionWrapper><Planning /></MotionWrapper>} />
                          <Route path="/categories" element={<MotionWrapper><Categories /></MotionWrapper>} />
                          <Route path="/buildings" element={<MotionWrapper><Buildings /></MotionWrapper>} />
                          <Route path="/settings" element={<MotionWrapper><Settings /></MotionWrapper>} />
                          <Route path="/documents" element={<MotionWrapper><Documents /></MotionWrapper>} />
                          <Route path="/test-pv" element={<MotionWrapper><TestPV /></MotionWrapper>} />
                          <Route path="/admin" element={<MotionWrapper><Admin /></MotionWrapper>} />
                          <Route path="*" element={<MotionWrapper><NotFound /></MotionWrapper>} />
                        </Routes>
                      </AnimatePresence>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </GoogleDriveProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
