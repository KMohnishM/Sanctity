"use client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotificationBell from '@/components/NotificationBell';
import React from 'react';

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="w-full bg-white shadow flex items-center justify-between px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold tracking-tight text-indigo-600">Sanctity</span>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded ml-2">Comment App</span>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        {user && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center font-semibold text-indigo-700">
              {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="font-medium text-gray-700">{user.username || user.email}</span>
            <button
              onClick={logout}
              className="ml-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 font-medium transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-2 sm:px-0 py-8">
        {children}
      </main>
    </AuthProvider>
  );
} 