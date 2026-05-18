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

                {/* Pending Route */}
                <Route path="/pending" element={
                  <ProtectedRoute>
                    <Pending />
                  </ProtectedRoute>
                } />

                {/* Protected App Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/people" element={
                  <ProtectedRoute>
                    <Layout><Batchmates /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/album" element={
                  <ProtectedRoute>
                    <Layout><Album /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/fund" element={
                  <ProtectedRoute>
                    <Layout><BatchFund /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/routine" element={
                  <ProtectedRoute>
                    <Layout><Routine /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <Layout><Tasks /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/backup" element={
                  <ProtectedRoute>
                    <Layout><BackupCounter /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/assessments" element={
                  <ProtectedRoute>
                    <Layout><Assessments /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/ai" element={
                  <ProtectedRoute>
                    <Layout><AIChatbot /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true} requireCR={true}>
                    <Layout><AdminPanel /></Layout>
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
