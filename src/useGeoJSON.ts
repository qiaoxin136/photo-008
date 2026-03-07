import { useState, useEffect } from 'react';
import type { WaterGeoJSON } from './types';

const API_URL = 'https://drd977abuk.execute-api.us-east-1.amazonaws.com/test/getData';

export function useGeoJSON() {
  const [data, setData] = useState<WaterGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
