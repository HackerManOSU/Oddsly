import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OddsPage from './components/OddsPage';
import './App.css'

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen p-4">
        <h1 className="text-8xl font-bold text-center text-white text-shadow-neon">Oddsly</h1>
        <OddsPage />
      </div>
    </QueryClientProvider>
  );
};

export default App;
