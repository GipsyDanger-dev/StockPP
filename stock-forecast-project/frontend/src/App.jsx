import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Market from './pages/Market';
import Admin from './pages/admin/Admin';
import ArticleDetail from './pages/articles/ArticleDetail';
import ArticleEditor from './pages/admin/ArticleEditor';
import PredictionHistory from './pages/PredictionHistory';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyCode from './pages/auth/VerifyCode';
import NewPassword from './pages/auth/NewPassword';
import Landing from './pages/Landing';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-code" element={<VerifyCode />} />
            <Route path="/new-password" element={<NewPassword />} />

            <Route path="/insights/:articleId" element={<ArticleDetail />} />

            <Route path="/admin/editor" element={
              <AdminRoute>
                <ArticleEditor />
              </AdminRoute>
            } />
            <Route path="/admin/editor/:articleId" element={
              <AdminRoute>
                <ArticleEditor />
              </AdminRoute>
            } />

            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/analytics/:ticker" element={<Analytics />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/market" element={<Market />} />
                    <Route path="/predictions" element={<PredictionHistory />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <Admin />
                      </AdminRoute>
                    } />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
