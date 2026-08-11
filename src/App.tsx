/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useStore } from './store/useStore';

import Login from './components/Login';
import Layout from './components/Layout';
import POS from './components/POS';
import Kitchen from './components/Kitchen';
import Dashboard from './components/Dashboard';
import History from './components/History';

import {
  unlockAppAudio,
  playNewOrderSound,
  playDoneSound,
  playPaymentSound,
  playDeliverSound,
} from './utils/audio';
import { speak } from './utils/speech';
import { getSoundEnabled, setSoundEnabled } from './utils/soundSettings';

type AppEventRow = {
  id: string;
  event_type: string;
  event_text: string | null;
  payload: Record<string, any> | null;
  created_at: string;
};

type LocalAppEvent = {
  id?: string;
  type?: string;
  payload?: Record<string, any>;
  source?: string;
  createdAt?: string;
};

export default function App() {
  const { userRole, activeTab, fetchInvoices } = useStore();
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const handledEventIdsRef = useRef<Set<string>>(new Set());
  const soundEnabledRef = useRef(true);
  const audioUnlockedRef = useRef(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const enabled = getSoundEnabled();
    setSoundEnabledState(enabled);
    soundEnabledRef.current = enabled;
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    audioUnlockedRef.current = audioUnlocked;
  }, [audioUnlocked]);

  const tryUnlockAudio = async () => {
    try {
      await unlockAppAudio();
      setAudioUnlocked(true);
      audioUnlockedRef.current = true;
      console.log('[audio] unlocked');
    } catch (error) {
      console.error('[audio] unlock lỗi:', error);
    }
  };

  useEffect(() => {
    const handleUnlock = () => {
      void tryUnlockAudio();
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };

    window.addEventListener('click', handleUnlock, { passive: true });
    window.addEventListener('touchstart', handleUnlock, { passive: true });
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock);

    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  useEffect(() => {
    if (!userRole) return;

    void fetchInvoices();

    const dataChannel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        async () => {
          await fetchInvoices();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_items' },
        async () => {
          await fetchInvoices();
        }
      )
      .subscribe((status) => {
        console.log('[realtime-orders] status:', status);
      });

    return () => {
      supabase.removeChannel(dataChannel);
    };
  }, [userRole, fetchInvoices]);

  const markHandled = (eventId: string) => {
    const set = handledEventIdsRef.current;

    if (set.has(eventId)) return false;

    set.add(eventId);

    if (set.size > 100) {
      const first = set.values().next().value;
      if (first) set.delete(first);
    }

    return true;
  };

  const handleUnifiedEvent = async ({
    id,
    type,
    eventText,
    payload,
    source,
  }: {
    id: string;
    type: string;
    eventText?: string | null;
    payload?: Record<string, any> | null;
    source?: 'local' | 'realtime' | string;
  }) => {
    if (!soundEnabledRef.current) return;
    if (!id || !type) return;
    if (!markHandled(id)) return;

    // Admin nghe tất cả. Staff/kitchen chỉ nghe local trên chính máy đó.
    if (!isAdmin && source !== 'local') return;

    const speechText =
      payload?.speechText ||
      payload?.message ||
      eventText ||
      '';

    console.log('[handleUnifiedEvent]', {
      role: userRole,
      activeTab,
      source,
      type,
      id,
      payload,
      speechText,
      soundEnabled: soundEnabledRef.current,
      audioUnlocked: audioUnlockedRef.current,
    });

    try {
      if (
        type === 'new_order' ||
        type === 'order_new' ||
        type === 'order_replay'
      ) {
        if (!audioUnlockedRef.current) {
          console.warn('[order] nhận được event nhưng audio chưa unlock');
          return;
        }

        await playNewOrderSound();

        if (speechText) {
          await speak(speechText, 'hcm-phuongly');
        }

        return;
      }

      if (type === 'kitchen_done') {
        if (!audioUnlockedRef.current) {
          console.warn('[kitchen_done] nhận được event nhưng audio chưa unlock');
          return;
        }

        await playDoneSound();

        if (speechText) {
          await speak(speechText, 'hcm-phuongly');
        }

        return;
      }

      if (
        type === 'payment_cash_success' ||
        type === 'payment_bank_success' ||
        type === 'payment_completed'
      ) {
        // Chỉ phát tiếng ting ting khi thao tác là thanh toán.
        // POS gửi eventAction: 'checkout' khi bấm thanh toán.
        // Gọi món / Gửi Bếp dùng eventAction: 'order' nên sẽ không phát tiếng tính tiền.
        if (payload?.eventAction !== 'checkout') {
          console.log('[payment] bỏ qua vì không phải thao tác checkout:', payload);
          return;
        }

        if (!audioUnlockedRef.current) {
          console.warn('[payment] nhận được event nhưng audio chưa unlock');
          return;
        }

        await playPaymentSound();

        if (speechText) {
          await speak(speechText, 'hcm-phuongly');
        }

        return;
      }

      if (
        type === 'delivery_success' ||
        type === 'delivery_completed'
      ) {
        if (!audioUnlockedRef.current) {
          console.warn('[delivery] nhận được event nhưng audio chưa unlock');
          return;
        }

        await playDeliverSound();

        if (speechText) {
          await speak(speechText, 'hcm-phuongly');
        }

        return;
      }
    } catch (error) {
      console.error('Lỗi xử lý app event:', error);
    }
  };

  useEffect(() => {
    if (!userRole) return;

    const eventChannel = supabase
      .channel(`app-events-listener-${userRole}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_events' },
        async (payload) => {
          console.log('[app_events realtime payload]', payload);

          const event = payload.new as AppEventRow;
          if (!event?.id) return;

          await handleUnifiedEvent({
            id: event.id,
            type: event.event_type,
            eventText: event.event_text,
            payload: event.payload,
            source: 'realtime',
          });
        }
      )
      .subscribe((status) => {
        console.log('[app-events-listener] status:', status, 'role:', userRole);
      });

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [userRole]);

  useEffect(() => {
    const handleLocalEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<LocalAppEvent>;
      const detail = customEvent.detail;

      if (!detail?.type) return;
      if (!soundEnabledRef.current) return;

      console.log('[local app-event]', detail);

      const id =
        detail.id ||
        `${detail.type}-${detail.payload?.orderId || 'unknown'}-${detail.createdAt || Date.now()}`;

      await handleUnifiedEvent({
        id,
        type: detail.type,
        eventText:
          typeof detail.payload?.speechText === 'string'
            ? detail.payload.speechText
            : null,
        payload: detail.payload || {},
        source: detail.source || 'local',
      });
    };

    window.addEventListener('app-event', handleLocalEvent as EventListener);

    return () => {
      window.removeEventListener('app-event', handleLocalEvent as EventListener);
    };
  }, [userRole]);

  const toggleSound = async () => {
    const next = !soundEnabledRef.current;

    setSoundEnabledState(next);
    soundEnabledRef.current = next;
    setSoundEnabled(next);

    if (next) {
      await tryUnlockAudio();
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  if (!userRole) {
    return <Login />;
  }

  return (
    <>
      <Layout>
        {activeTab === 'pos' && <POS />}
        {activeTab === 'kitchen' && <Kitchen />}
        {activeTab === 'history' && <History />}
        {activeTab === 'dashboard' && <Dashboard />}
      </Layout>

      <button
        onClick={() => void toggleSound()}
        className={`fixed right-4 top-4 max-lg:top-auto max-lg:bottom-24 z-40 w-11 h-11 rounded-full border shadow-md flex items-center justify-center transition-all ${
          soundEnabled
            ? 'bg-lime-50 border-lime-200 hover:bg-lime-100'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-lime-600" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-500" />
        )}
      </button>
    </>
  );
}