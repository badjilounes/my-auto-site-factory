'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@my-auto-site-factory/shared-ui';
import { getProspects } from '../../lib/api';

const PROSPECT_STATUSES = [
  'NEW',
  'ENRICHED',
  'SITE_GENERATING',
  'SITE_GENERATED',
  'SITE_DEPLOYED',
  'OUTREACH_SENT',
  'INTERESTED',
  'CLIENT',
  'REJECTED',
] as const;

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
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

export function ProspectsPage() {
  const [prospects, setProspects] = React.useState<any[]>([]);
  const [meta, setMeta] = React.useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterCity, setFilterCity] = React.useState('');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getProspects({
          search: search || undefined,
          status: filterStatus || undefined,
          city: filterCity || undefined,
          page,
          limit: 20,
        });
        if (!cancelled) {
          setProspects(result.data);
          setMeta(result.meta);
        }
      } catch {
        // silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [search, filterStatus, filterCity, page]);

  function handleClearFilters() {
    setSearch('');
    setFilterStatus('');
    setFilterCity('');
    setPage(1);
  }

  const hasFilters = search || filterStatus || filterCity;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {meta.total}
          </span>
        </div>
        <Link
          href="/scraping"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Nouveau scraping
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom, email, telephone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les statuts</option>
              {PROSPECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Ville
            </label>
            <input
              type="text"
              placeholder="Filtrer par ville..."
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Prospects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ville
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cuisine
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : prospects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >
                    <p className="text-slate-400 text-sm">
                      {hasFilters
                        ? 'Aucun prospect ne correspond aux filtres.'
                        : 'Aucun prospect pour le moment. Lancez un scraping pour commencer.'}
                    </p>
                    {!hasFilters && (
                      <Link
                        href="/scraping"
                        className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Lancer un scraping
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                prospects.map((prospect, index) => (
                  <tr
                    key={prospect.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      index % 2 === 1 ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/prospects/${prospect.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {prospect.businessName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {prospect.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {prospect.cuisineType || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {prospect.rating != null
                        ? `${prospect.rating}/5`
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={prospect.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatRelativeDate(prospect.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/prospects/${prospect.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {meta.page} sur {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precedent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProspectsPage;
