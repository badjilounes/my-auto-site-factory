import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GeneratedSite {
  id: string;
  prospectId: string;
  repositoryUrl: string | null;
  repositoryName: string | null;
  vercelProjectId: string | null;
  vercelUrl: string | null;
  deploymentStatus: string;
  templateUsed: string | null;
  createdAt: string;
  updatedAt: string;
  prospect?: {
    id: string;
    businessName: string;
    city: string | null;
    cuisine: string | null;
  };
}

// ─── useGeneratedSites ──────────────────────────────────────────────────────

export function useGeneratedSites() {
  const [sites, setSites] = useState<GeneratedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/generated-sites`);
      if (!res.ok) {
        throw new Error(`Failed to fetch generated sites: ${res.statusText}`);
      }

      const json = await res.json();
      setSites(json.data ?? (Array.isArray(json) ? json : []));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return { sites, loading, error, refetch: fetchSites };
}

// ─── useGeneratedSite ───────────────────────────────────────────────────────

export function useGeneratedSite(id: string | null) {
  const [site, setSite] = useState<GeneratedSite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSite = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/generated-sites/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch generated site: ${res.statusText}`);
      }

      const json = await res.json();
      setSite(json.data ?? json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  return { site, loading, error, refetch: fetchSite };
}
