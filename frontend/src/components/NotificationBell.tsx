"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { BellIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  comment: {
    id: string;
    content: string;
    username: string;
  };
}

export default function NotificationBell() {
  const { user, socket } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (!user) return;
    api.getNotifications().then(setNotifications);
    api.getUnreadCount().then((res: { count: number }) => setUnreadCount(res.count));
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [socket]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    await api.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(count => Math.max(0, count - 1));
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full px-1.5 text-xs font-semibold border-2 border-white shadow">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 animate-fade-in">
          <div className="px-4 py-2 border-b border-gray-100 font-semibold text-gray-700">Notifications</div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No notifications</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition hover:bg-indigo-50 ${n.isRead ? '' : 'bg-indigo-50'}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-indigo-700">{n.comment.username}</span>
                  <span className="text-gray-600 text-sm">replied:</span>
                  <span className="text-gray-800 text-sm truncate max-w-[120px]">{n.comment.content}</span>
                  {!n.isRead && <span className="ml-2 text-xs text-indigo-600 font-semibold">New</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 