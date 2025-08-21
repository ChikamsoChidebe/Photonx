'use client';

import { ReactNode, useState, useEffect } from 'react';
import { PhotonXProvider } from '@/store/PhotonXProvider';
import { WebSocketProvider } from '@/hooks/useWebSocket';
import { NotificationProvider } from '@/hooks/useNotifications';

// Simplified configuration for demo

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading PhotonX...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <WebSocketProvider>
        <PhotonXProvider>
          <div className="relative">
            {children}
            
            {/* Development indicators */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 left-4 z-50">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-yellow-800">
                      Development Mode
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PhotonXProvider>
      </WebSocketProvider>
    </NotificationProvider>
  );
}

// Simplified providers for demo