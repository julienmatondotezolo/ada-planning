'use client';

import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

let listeners: Array<(toast: ToastMessage) => void> = [];

export function toast(msg: Omit<ToastMessage, 'id'>) {
  const t: ToastMessage = { ...msg, id: Date.now().toString() };
  listeners.forEach((fn) => fn(t));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((t: ToastMessage) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, t.duration || 4000);
  }, []);

  // Register listener
  useState(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  });

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, dismiss };
}
