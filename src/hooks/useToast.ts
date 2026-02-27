'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

let toastCounter = 0;
let listeners: Array<(toast: ToastMessage) => void> = [];

export function toast(msg: Omit<ToastMessage, 'id'>) {
  const t: ToastMessage = { ...msg, id: `toast-${++toastCounter}-${Date.now()}` };
  listeners.forEach((fn) => fn(t));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToastRef = useRef<(t: ToastMessage) => void>();

  addToastRef.current = (t: ToastMessage) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, t.duration || 4000);
  };

  // Register/unregister listener via useEffect (correct cleanup for StrictMode)
  useEffect(() => {
    const handler = (t: ToastMessage) => addToastRef.current?.(t);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, dismiss };
}
