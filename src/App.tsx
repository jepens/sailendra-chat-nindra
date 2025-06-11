import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ContactsProvider } from '@/contexts/ContactsContext';
import { Loader2 } from "lucide-react";

// Lazy load components for better performance
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const Logs = lazy(() => import("./pages/Logs"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const Calendar = lazy(() => import('./pages/Calendar'));
const CalendarCallback = lazy(() => import('./pages/CalendarCallback'));
const SentimentDashboard = lazy(() => import('./pages/SentimentDashboard'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-sailendra-500" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache queries for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries
      retry: 2,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ContactsProvider>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/logs" element={
                  <ProtectedRoute>
                    <Logs />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                  <Route path="/contacts" element={
                    <ProtectedRoute>
                      <ContactsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/calendar" element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  <Route path="/calendar/callback" element={<CalendarCallback />} />
                  <Route path="/sentiment" element={
                    <ProtectedRoute>
                      <SentimentDashboard />
                    </ProtectedRoute>
                  } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </ContactsProvider>
  </QueryClientProvider>
);

export default App;
