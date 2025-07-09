"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

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
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
        aria-label="Notifications"
      >
        <span style={{ fontSize: 24 }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: 12,
          }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: 280,
          zIndex: 1000,
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 16, color: '#888' }}>No notifications</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: 12,
                  background: n.isRead ? '#f9f9f9' : '#e6f7ff',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                }}
                onClick={() => markAsRead(n.id)}
              >
                <div style={{ fontSize: 14 }}>
                  <b>{n.comment.username}</b> replied: <span style={{ color: '#333' }}>{n.comment.content}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{new Date(n.createdAt).toLocaleString()}</div>
                {!n.isRead && <span style={{ color: '#1890ff', fontSize: 11 }}>New</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 