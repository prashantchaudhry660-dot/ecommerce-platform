import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { getApiBaseUrl } from '../api/client';

export function useAdminActivityStream(onMessage: (event: { type: string; data: any }) => void) {
  const { user, accessToken } = useAuthStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN' || !accessToken) {
      return;
    }

    const apiBase = getApiBaseUrl();
    const url = `${apiBase}/admin/sse/activity-stream?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    const eventNames = ['ACTIVITY_LOG', 'ORDER_PLACED', 'ORDER_UPDATED', 'PRODUCT_MODERATED', 'ITEM_STATUS_UPDATED'];
    eventNames.forEach((name) => {
      es.addEventListener(name, (evt: MessageEvent) => {
        try {
          const parsed = JSON.parse(evt.data);
          onMessage({ type: name, data: parsed });
        } catch {
          // ignore parse errors
        }
      });
    });

    es.onerror = () => {
      // Reconnection handled automatically by browser EventSource
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user, accessToken, onMessage]);
}

export function useSellerOrderStream(onMessage: (event: { type: string; data: any }) => void) {
  const { user, accessToken } = useAuthStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'SELLER' || !accessToken) {
      return;
    }

    const apiBase = getApiBaseUrl();
    const url = `${apiBase}/seller/sse/order-stream?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    const eventNames = ['NEW_ORDER_ALERT', 'ITEM_STATUS_UPDATED'];
    eventNames.forEach((name) => {
      es.addEventListener(name, (evt: MessageEvent) => {
        try {
          const parsed = JSON.parse(evt.data);
          onMessage({ type: name, data: parsed });
        } catch {
          // ignore parse errors
        }
      });
    });

    es.onerror = () => {
      // Reconnection handled automatically
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user, accessToken, onMessage]);
}
