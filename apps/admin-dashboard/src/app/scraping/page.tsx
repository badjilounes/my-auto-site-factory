'use client';

import React from 'react';
import { StatusBadge } from '@my-auto-site-factory/shared-ui';
import { startScrapingJob, getScrapingJobs } from '../../lib/api';

const SCRAPING_SOURCES = ['UBEREATS', 'DELIVEROO'] as const;

function formatDuration(startDate: string, endDate: string | null): string {
  if (!endDate) return '-';
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return `${min}m ${sec}s`;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function ScrapingPage() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [source, setSource] = React.useState<string>('UBEREATS');
  const [city, setCity] = React.useState('');
  const [cuisine, setCuisine] = React.useState('');

  const fetchJobs = React.useCallback(async () => {
    try {
      const result = await getScrapingJobs();
      setJobs(result.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh while any job is RUNNING or PENDING
  React.useEffect(() => {
    const hasActiveJob = jobs.some(
      (job) => job.status === 'RUNNING' || job.status === 'PENDING'
    );
    if (!hasActiveJob) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 10000);

    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await startScrapingJob({
        source,
        city: city.trim(),
        cuisineType: cuisine.trim() || undefined,
      });
      setMessage({ type: 'success', text: 'Job de scraping lance avec succes.' });
      setCity('');
      setCuisine('');
      setSource('UBEREATS');
      await fetchJobs();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Erreur lors du lancement du job.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Scraping</h1>
      </div>

      {/* New Job Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Nouveau job de scraping
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Source <span className="text-red-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {SCRAPING_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ex: Paris, Lyon, Marseille..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Cuisine (optionnel)
              </label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="ex: Italien, Japonais, Pizza..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !city.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Lancement...' : 'Lancer'}
            </button>
          </div>
          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Historique des jobs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ville
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Resultats
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Duree
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-slate-400 text-sm"
                  >
                    Aucun job de scraping pour le moment. Lancez-en un ci-dessus.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {job.source}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {job.city}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {job.totalProcessed != null && job.totalFound != null
                        ? `${job.totalProcessed}/${job.totalFound}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(job.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDuration(job.createdAt, job.completedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ScrapingPage;
