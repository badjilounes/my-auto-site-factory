'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { getMyAccount } from '../../lib/api';

type ClientAccount = Awaited<ReturnType<typeof getMyAccount>>;

const deploymentStatusColors: Record<string, string> = {
  DEPLOYED: 'bg-green-100 text-green-700',
  BUILDING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
};

const deploymentStatusLabels: Record<string, string> = {
  DEPLOYED: 'En ligne',
  BUILDING: 'En construction',
  PENDING: 'En attente',
  FAILED: 'Echec',
};

export function SitePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [account, setAccount] = React.useState<ClientAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        const data = await getMyAccount();
        setAccount(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session, sessionStatus]);

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Chargement des informations du site...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const site = account?.prospect?.generatedSite;
  const deploymentStatus = site?.deploymentStatus || 'PENDING';
  const isDeployed = deploymentStatus === 'DEPLOYED' && site?.deploymentUrl;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Mon Site</h1>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            deploymentStatusColors[deploymentStatus] || 'bg-zinc-100 text-zinc-700'
          }`}
        >
          {deploymentStatusLabels[deploymentStatus] || deploymentStatus}
        </span>
      </div>

      {isDeployed && site?.deploymentUrl ? (
        <>
          {/* Site URL */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600 break-all">
                {site.deploymentUrl}
              </p>
              <a
                href={site.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>

          {/* iframe preview */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
            <iframe
              src={site.deploymentUrl}
              className="w-full h-[700px]"
              title={`Apercu de ${account?.prospect?.businessName || 'votre site'}`}
            />
          </div>

          {/* Info card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Informations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Etablissement
                </p>
                <p className="text-sm text-zinc-900">
                  {account?.prospect?.businessName || '-'}
                </p>
              </div>
              {site.githubRepoUrl && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                    Depot GitHub
                  </p>
                  <a
                    href={site.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
                  >
                    {site.githubRepoUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <div className="flex flex-col items-center justify-center py-12">
            {site ? (
              <>
                <p className="text-zinc-500 text-lg mb-2">
                  Votre site est en cours de creation...
                </p>
                <p className="text-zinc-400 text-sm">
                  La generation peut prendre quelques minutes. Revenez bientot.
                </p>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-lg mb-2">
                  Aucun site genere pour le moment
                </p>
                <p className="text-zinc-400 text-sm">
                  Votre site sera disponible prochainement.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SitePage;
