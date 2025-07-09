"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import NotificationBell from '@/components/NotificationBell';
import React from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ position: 'fixed', top: 16, right: 24, zIndex: 2000 }}>
        <NotificationBell />
      </div>
      {children}
    </AuthProvider>
  );
} 