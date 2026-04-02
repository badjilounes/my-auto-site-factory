'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@my-auto-site-factory/shared-ui';
import { getGeneratedSites } from '../../lib/api';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export function SitesPage() {
  const [sites, setSites] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSites() {
      try {
        const result = await getGeneratedSites();
        setSites(result.data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sites generes</h1>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {loading ? '-' : sites.length}
        </span>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm mb-3">
            Aucun site genere pour le moment.
          </p>
          <Link
            href="/prospects"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Voir les prospects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Mini Preview */}
              {site.deploymentUrl ? (
                <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-200">
                  <iframe
                    src={site.deploymentUrl}
                    className="w-full h-full pointer-events-none"
                    title={`Apercu de ${site.prospect?.businessName || site.businessName || 'Site'}`}
                    tabIndex={-1}
                    loading="lazy"
                  />
                  <div className="absolute inset-0" />
                </div>
              ) : (
                <div className="h-48 bg-slate-50 border-b border-slate-200 flex items-center justify-center">
                  <p className="text-slate-300 text-sm">Pas de preview</p>
                </div>
              )}

              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 truncate mr-2">
                    {site.prospect?.businessName || site.businessName || 'Sans nom'}
                  </h3>
                  <StatusBadge status={site.deploymentStatus} />
                </div>

                {site.template && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 mb-3">
                    {site.template}
                  </span>
                )}

                <div className="space-y-2 mt-3">
                  {site.deploymentUrl && (
                    <a
                      href={site.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:text-blue-800 truncate transition-colors"
                    >
                      {site.deploymentUrl}
                    </a>
                  )}

                  {site.githubRepoUrl && (
                    <a
                      href={site.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-slate-500 hover:text-slate-700 truncate transition-colors"
                    >
                      {site.githubRepoUrl}
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/prospects/${site.prospectId}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Voir le prospect
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SitesPage;
