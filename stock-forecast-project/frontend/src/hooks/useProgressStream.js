import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function useProgressStream(endpoint, params = {}) {
  const [steps, setSteps] = useState([]);
  const [epochs, setEpochs] = useState([]);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const start = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError('Not authenticated');
      setStatus('error');
      return;
    }

    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.set('token', session.access_token);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    setSteps([]);
    setEpochs([]);
    setStatus('streaming');
    setResult(null);
    setError(null);

    const es = new EventSource(url.toString());
    eventSourceRef.current = es;

    es.addEventListener('step', (e) => {
      const data = JSON.parse(e.data);
      setSteps(prev => {
        const idx = prev.findIndex(s => s.step === data.step);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    es.addEventListener('train_step', (e) => {
      const data = JSON.parse(e.data);
      setSteps(prev => {
        const idx = prev.findIndex(s => s.step === data.step);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    es.addEventListener('epoch', (e) => {
      const data = JSON.parse(e.data);
      setEpochs(prev => [...prev, data]);
    });

    es.addEventListener('complete', (e) => {
      setResult(JSON.parse(e.data));
      setStatus('done');
      es.close();
    });

    es.addEventListener('train_complete', (e) => {
      setResult(JSON.parse(e.data));
    });

    es.addEventListener('error_event', (e) => {
      setError(JSON.parse(e.data).message);
      setStatus('error');
      es.close();
    });

    es.onerror = () => {
      if (eventSourceRef.current === es) {
        setError('Connection lost');
        setStatus('error');
        es.close();
      }
    };
  }, [endpoint, JSON.stringify(params)]);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return { steps, epochs, status, result, error, start, stop };
}
