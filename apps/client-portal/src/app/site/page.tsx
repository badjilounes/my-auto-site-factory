'use client';

import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface SiteInfo {
  url: string | null;
  previewUrl: string | null;
  repositoryUrl: string | null;
  status: string;
  domain: string | null;
  businessName: string;
  lastUpdated: string | null;
}

export default function SitePage() {
  const [site, setSite] = React.useState<SiteInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSite() {
      try {
        const res = await fetch(`${API_URL}/api/client/site`, {
          credentials: 'include',
        });
        if (res.ok) {
          setSite(await res.json());
        }
      } catch (error) {
        console.error(
          'Erreur lors du chargement des informations du site:',
          error
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSite();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Chargement des informations du site...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400 mb-2">
          Aucune information de site disponible
        </p>
        <p className="text-zinc-500 text-sm">
          Votre site est peut-etre encore en cours de preparation. Veuillez
          revenir bientot.
        </p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    deployed: 'bg-green-100 text-green-700',
    building: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    deployed: 'Deploye',
    building: 'En construction',
    pending: 'En attente',
    failed: 'Echec',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Mon Site</h1>
        <p className="text-zinc-500 mt-1">
          Visualisez et gerez votre site vitrine
        </p>
      </div>

      {/* Site Info Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {site.businessName}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[site.status] || 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {statusLabels[site.status] || site.status}
              </span>
              {site.lastUpdated && (
                <span className="text-xs text-zinc-500">
                  Derniere mise a jour :{' '}
                  {new Date(site.lastUpdated).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {site.url && (
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Ouvrir le site
              </a>
            )}
            {site.repositoryUrl && (
              <a
                href={site.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium"
              >
                Voir le depot
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Site Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
            URL du site
          </p>
          {site.url ? (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
            >
              {site.url}
            </a>
          ) : (
            <p className="text-sm text-zinc-400">Pas encore disponible</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
            Domaine personnalise
          </p>
          <p className="text-sm text-zinc-900">
            {site.domain || 'Non configure'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
            Depot
          </p>
          {site.repositoryUrl ? (
            <a
              href={site.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
            >
              {site.repositoryUrl}
            </a>
          ) : (
            <p className="text-sm text-zinc-400">Pas encore disponible</p>
          )}
        </div>
      </div>

      {/* Site Preview */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Apercu du site
        </h2>
        {site.previewUrl ? (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <iframe
              src={site.previewUrl}
              className="w-full h-[700px]"
              title={`Apercu de ${site.businessName}`}
            />
          </div>
        ) : (
          <div className="border border-dashed border-zinc-300 rounded-lg flex items-center justify-center h-[400px] bg-zinc-50">
            <div className="text-center">
              <p className="text-zinc-400 mb-1">
                Apercu non disponible pour le moment
              </p>
              <p className="text-zinc-500 text-sm">
                Votre site est en cours de construction. Cela peut prendre
                quelques minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
