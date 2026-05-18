import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Market from './pages/Market';
import Admin from './pages/Admin';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEditor from './pages/ArticleEditor';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Standalone pages (no sidebar layout) */}
          <Route path="/insights/:articleId" element={<ArticleDetail />} />
          <Route path="/admin/editor" element={<ArticleEditor />} />
          <Route path="/admin/editor/:articleId" element={<ArticleEditor />} />

          {/* Pages with sidebar layout */}
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/analytics/:ticker" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/market" element={<Market />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
