const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Erreur ${res.status}`);
  }
  return res.json();
}

// Client account
export async function getMyAccount() {
  return fetchApi<{
    id: string;
    email: string;
    businessName: string;
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    trialEndsAt: string | null;
    currentPeriodEndsAt: string | null;
    customDomain: string | null;
    prospect: {
      id: string;
      businessName: string;
      generatedSite: {
        deploymentUrl: string | null;
        deploymentStatus: string;
        githubRepoUrl: string | null;
        generatedCode: string | null;
      } | null;
    };
    invoices: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      description: string | null;
      dueDate: string;
      paidAt: string | null;
      pdfUrl: string | null;
      createdAt: string;
    }>;
  }>('/clients/me');
}

// Domain
export async function updateDomain(domain: string) {
  return fetchApi<{
    domain: string;
    verified: boolean;
    dnsRecords: Array<{ type: string; name: string; value: string }>;
  }>('/clients/me/domain', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
}

export async function verifyDomain() {
  return fetchApi<{ verified: boolean }>('/clients/me/domain/verify', {
    method: 'POST',
  });
}
