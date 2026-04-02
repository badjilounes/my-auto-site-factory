'use client';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProspectFilters {
  status?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Prospect {
  id: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  website: string | null;
  uberEatsUrl: string | null;
  deliverooUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  cuisine: string | null;
  openingHours: Record<string, string> | null;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  generatedSite?: {
    id: string;
    vercelUrl: string | null;
    repositoryUrl: string | null;
    deploymentStatus: string;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── useProspects ───────────────────────────────────────────────────────────

export function useProspects(filters: ProspectFilters = {}) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.city) params.set('city', filters.city);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await fetch(`${API_URL}/api/prospects?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch prospects: ${res.statusText}`);
      }

      const json = await res.json();

      if (json.data) {
        setProspects(json.data);
        if (json.pagination) setPagination(json.pagination);
      } else if (Array.isArray(json)) {
        setProspects(json);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.city, filters.search, filters.page, filters.limit]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  return { prospects, pagination, loading, error, refetch: fetchProspects };
}

// ─── useProspect ────────────────────────────────────────────────────────────

export function useProspect(id: string | null) {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProspect = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/prospects/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch prospect: ${res.statusText}`);
      }

      const json = await res.json();
      setProspect(json.data ?? json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProspect();
  }, [fetchProspect]);

  return { prospect, loading, error, refetch: fetchProspect };
}

// ─── useCreateProspect ──────────────────────────────────────────────────────

export function useCreateProspect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProspect = useCallback(
    async (data: Partial<Prospect>): Promise<Prospect | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/prospects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error(`Failed to create prospect: ${res.statusText}`);
        }

        const json = await res.json();
        return json.data ?? json;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createProspect, loading, error };
}

// ─── useUpdateProspect ──────────────────────────────────────────────────────

export function useUpdateProspect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProspect = useCallback(
    async (id: string, data: Partial<Prospect>): Promise<Prospect | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/prospects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error(`Failed to update prospect: ${res.statusText}`);
        }

        const json = await res.json();
        return json.data ?? json;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateProspect, loading, error };
}

// ─── useGenerateSite ────────────────────────────────────────────────────────

export function useGenerateSite(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSite = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/prospects/${id}/generate-site`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Failed to trigger site generation: ${res.statusText}`);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { generateSite, loading, error };
}

// ─── useSendOutreach ────────────────────────────────────────────────────────

export function useSendOutreach(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOutreach = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/prospects/${id}/send-outreach`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Failed to send outreach: ${res.statusText}`);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { sendOutreach, loading, error };
}
