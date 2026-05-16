import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';

// 1. Inisialisasi QueryClient di luar komponen
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Opsional: agar tidak re-fetch terus saat ganti tab
      retry: 1,
    },
  },
});

function App() {
  // PENTING: JANGAN panggil useHealth() atau hook apapun di sini!
  // Semua hook harus dipanggil di dalam komponen Dashboard atau komponen di bawahnya.

  return (
    // 2. Bungkus aplikasi dengan Provider
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white">
        <Dashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;