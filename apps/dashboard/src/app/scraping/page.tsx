'use client';

import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface ScrapingJob {
  id: string;
  city: string;
  source: string;
  cuisine: string;
  status: string;
  totalFound: number;
  totalProcessed: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

const jobStatusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function ScrapingPage() {
  const [jobs, setJobs] = React.useState<ScrapingJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [city, setCity] = React.useState('');
  const [source, setSource] = React.useState('google_maps');
  const [cuisine, setCuisine] = React.useState('');

  async function fetchJobs() {
    try {
      const res = await fetch(`${API_URL}/api/scraping/jobs`);
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch scraping jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchJobs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/scraping/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          source,
          cuisine: cuisine.trim() || undefined,
        }),
      });
      if (res.ok) {
        setCity('');
        setCuisine('');
        setSource('google_maps');
        await fetchJobs();
      }
    } catch (error) {
      console.error('Failed to create scraping job:', error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Scraping Jobs</h1>
        <p className="text-slate-500 mt-1">
          Start new scraping jobs and monitor progress
        </p>
      </div>

      {/* New Job Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Start New Scraping Job
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Austin, TX"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="google_maps">Google Maps</option>
              <option value="yelp">Yelp</option>
              <option value="tripadvisor">TripAdvisor</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cuisine (optional)
            </label>
            <input
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g., Italian, Mexican"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !city.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Starting...' : 'Start Job'}
          </button>
        </form>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Past Jobs</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                City
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Source
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cuisine
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Results
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Loading jobs...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No scraping jobs yet. Start one above.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {job.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {job.source.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {job.cuisine || 'All'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        jobStatusColors[job.status] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.errorMessage && (
                      <p className="text-xs text-red-500 mt-1">
                        {job.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {job.totalProcessed}/{job.totalFound} processed
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
