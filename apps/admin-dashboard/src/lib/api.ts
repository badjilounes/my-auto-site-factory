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
    throw new Error(error.message || `API error ${res.status}`);
  }
  return res.json();
}

// Prospects
export async function getProspects(params?: {
  status?: string;
  city?: string;
  cuisineType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.city) qs.set('city', params.city);
  if (params?.cuisineType) qs.set('cuisineType', params.cuisineType);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return fetchApi<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(`/prospects?${qs}`);
}

export async function getProspect(id: string) {
  return fetchApi<any>(`/prospects/${id}`);
}

export async function triggerSiteGeneration(id: string) {
  return fetchApi<{ message: string }>(`/prospects/${id}/generate-site`, {
    method: 'POST',
  });
}

export async function triggerOutreach(id: string) {
  return fetchApi<{ message: string }>(`/prospects/${id}/send-outreach`, {
    method: 'POST',
  });
}

export async function updateProspectStatus(id: string, status: string) {
  return fetchApi<any>(`/prospects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Analytics
export async function getDashboardStats() {
  return fetchApi<{
    prospectsByStatus: Record<string, number>;
    totalProspects: number;
    totalSitesDeployed: number;
    totalClients: number;
    monthlyRevenue: number;
    conversionRate: number;
    emailStats: {
      total: number;
      sent: number;
      opened: number;
      clicked: number;
      bounced: number;
      openRate: number;
      clickRate: number;
    };
  }>('/analytics/dashboard');
}

// Scraping
export async function startScrapingJob(data: {
  source: string;
  city: string;
  cuisineType?: string;
}) {
  return fetchApi<any>('/scraping/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getScrapingJobs() {
  return fetchApi<{ data: any[]; meta: any }>('/scraping/jobs');
}

// Generated Sites
export async function getGeneratedSites() {
  return fetchApi<{ data: any[]; meta: any }>('/generated-sites');
}
