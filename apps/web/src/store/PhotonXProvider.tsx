'use client';

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface PhotonXState {
  isConnected: boolean;
  activeChannels: number;
  totalTrades: number;
}

interface PhotonXActions {
  connect: () => void;
  disconnect: () => void;
}

interface PhotonXContextType {
  state: PhotonXState;
  actions: PhotonXActions;
}

const PhotonXContext = createContext<PhotonXContextType | undefined>(undefined);

export function PhotonXProvider({ children }: { children: ReactNode }) {
  const state: PhotonXState = {
    isConnected: false,
    activeChannels: 0,
    totalTrades: 0
  };

  const actions: PhotonXActions = {
    connect: () => {},
    disconnect: () => {}
  };

  return (
    <PhotonXContext.Provider value={{ state, actions }}>
      {children}
    </PhotonXContext.Provider>
  );
}

export function usePhotonX() {
  const context = useContext(PhotonXContext);
  if (!context) {
    throw new Error('usePhotonX must be used within PhotonXProvider');
  }
  return context;
}