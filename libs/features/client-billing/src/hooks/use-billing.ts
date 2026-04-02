import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BillingInfo {
  clientAccountId: string;
  email: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  stripeCustomerId: string | null;
  customDomain: string | null;
  currentPeriodEndsAt: string | null;
  trialEndsAt: string | null;
}

export interface Invoice {
  id: string;
  clientAccountId: string;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  status: string;
  plan: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

// ─── useBillingInfo ─────────────────────────────────────────────────────────

export function useBillingInfo() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/billing/info`);
      if (!res.ok) {
        throw new Error(`Failed to fetch billing info: ${res.statusText}`);
      }

      const json = await res.json();
      setBillingInfo(json.data ?? json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingInfo();
  }, [fetchBillingInfo]);

  return { billingInfo, loading, error, refetch: fetchBillingInfo };
}

// ─── useInvoices ────────────────────────────────────────────────────────────

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/billing/invoices`);
      if (!res.ok) {
        throw new Error(`Failed to fetch invoices: ${res.statusText}`);
      }

      const json = await res.json();
      setInvoices(json.data ?? (Array.isArray(json) ? json : []));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, refetch: fetchInvoices };
}

// ─── useSubscription ────────────────────────────────────────────────────────

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/billing/subscription`);
      if (!res.ok) {
        throw new Error(`Failed to fetch subscription: ${res.statusText}`);
      }

      const json = await res.json();
      setSubscription(json.data ?? json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
}
