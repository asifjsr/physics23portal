import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PerformanceProvider } from '@/context/PerformanceContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Pending = lazy(() => import('./pages/Pending'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Batchmates = lazy(() => import('./pages/Batchmates'));
const Album = lazy(() => import('./pages/Album'));
const BatchFund = lazy(() => import('./pages/BatchFund'));
const Routine = lazy(() => import('./pages/Routine'));
const Tasks = lazy(() => import('./pages/Tasks'));
const BackupCounter = lazy(() => import('./pages/BackupCounter'));
const Assessments = lazy(() => import('./pages/Assessments'));
const AIChatbot = lazy(() => import('./pages/AIChatbot'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
    <div className="fixed inset-0 z-[-1]">
      <div className="absolute inset-0 bg-radial-[at_50%_50%,_#1e1b4b_0%,_#020617_100%] opacity-50" />
    </div>
    <div className="flex flex-col items-center gap-6 relative z-10">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border-4 border-purple-500/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Physics 23 Portal</p>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] animate-pulse">Loading Experience...</p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <PerformanceProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/album" element={<Layout><Album /></Layout>} />

                {/* Pending Route */}
                <Route path="/pending" element={
                  <ProtectedRoute>
                    <Pending />
                  </ProtectedRoute>
                } />

                {/* Protected App Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><Dashboard /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/people" element={
                  <Layout><ErrorBoundary><Batchmates /></ErrorBoundary></Layout>
                } />
                <Route path="/fund" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><BatchFund /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/routine" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><Routine /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><Tasks /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/backup" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><BackupCounter /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/assessments" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><Assessments /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/ai" element={
                  <ProtectedRoute>
                    <Layout><ErrorBoundary><AIChatbot /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true} requireCR={true}>
                    <Layout><ErrorBoundary><AdminPanel /></ErrorBoundary></Layout>
                  </ProtectedRoute>
                } />

                {/* Catch All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  );
}
