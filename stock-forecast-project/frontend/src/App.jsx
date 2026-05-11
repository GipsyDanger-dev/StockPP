import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, Sidebar } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { useHealth } from './hooks/useApi';
import './index.css';

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
    },
  },
});

/**
 * App Content Component - Contains all app logic
 */
function AppContent() {
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [selectedDays, setSelectedDays] = useState(5);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { data: healthData, status: healthStatus } = useHealth();
  const apiStatus = healthStatus === 'success' ? 'online' : 'offline';

  useEffect(() => {
    // Log app initialization
    console.log('🚀 StockForecast App initialized');
    console.log('📡 API Status:', apiStatus);
  }, [apiStatus]);

  const handleTickerSearch = (ticker) => {
    setSelectedTicker(ticker);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleDaysChange = (days) => {
    setSelectedDays(days);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <Header 
        onTickerSearch={handleTickerSearch}
        apiStatus={apiStatus}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar
            onPeriodChange={handlePeriodChange}
            onDaysChange={handleDaysChange}
            selectedPeriod={selectedPeriod}
            selectedDays={selectedDays}
          />
        )}

        {/* Dashboard */}
        <main className="flex-1 overflow-auto">
          <Dashboard
            ticker={selectedTicker}
            period={selectedPeriod}
            daysAhead={selectedDays}
            apiStatus={apiStatus}
          />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/**
 * Main App Component - Wraps content with QueryClientProvider
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
