import React, { createContext, useContext, useState, useEffect } from 'react';

interface PerformanceContextType {
  lowDataMode: boolean;
  setLowDataMode: (value: boolean) => void;
  isSlowNetwork: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [lowDataMode, setLowDataModeState] = useState(() => {
    const saved = localStorage.getItem('lowDataMode');
    if (saved !== null) return saved === 'true';
    
    // Auto-detect slow network
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.saveData) return true;
      if (['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return true;
    }
    return false;
  });

  const [isSlowNetwork, setIsSlowNetwork] = useState(() => {
    const conn = (navigator as any).connection;
    return conn ? ['slow-2g', '2g', '3g'].includes(conn.effectiveType) : false;
  });

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn) {
      const updateConnectionStatus = () => {
        setIsSlowNetwork(['slow-2g', '2g', '3g'].includes(conn.effectiveType));
      };
      conn.addEventListener('change', updateConnectionStatus);
      return () => conn.removeEventListener('change', updateConnectionStatus);
    }
  }, []);

  const setLowDataMode = (value: boolean) => {
    setLowDataModeState(value);
    localStorage.setItem('lowDataMode', String(value));
  };

  return (
    <PerformanceContext.Provider value={{ lowDataMode, setLowDataMode, isSlowNetwork }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}
