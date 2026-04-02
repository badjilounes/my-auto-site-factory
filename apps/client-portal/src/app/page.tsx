'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getMyAccount } from '../lib/api';

type ClientAccount = Awaited<ReturnType<typeof getMyAccount>>;

const subscriptionStatusColors: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-zinc-100 text-zinc-700',
};

const subscriptionStatusLabels: Record<string, string> = {
  TRIAL: 'Essai gratuit',
  ACTIVE: 'Actif',
  CANCELLED: 'Annule',
  EXPIRED: 'Expire',
};

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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

const features = [
  'Hebergement haute performance',
  'Domaine personnalise',
  'Support technique',
  'Design responsive',
];

export function ClientPortalHome() {
  const { data: session, status } = useSession();
  const [account, setAccount] = React.useState<ClientAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setLoading(false);
      return;
    }
    async function fetchAccount() {
      try {
        const data = await getMyAccount();
        setAccount(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Votre site vitrine professionnel
          </h1>
          <p className="text-zinc-500 mb-8 text-lg">
            Nous avons cree un site moderne pour votre etablissement.
            Connectez-vous pour le gerer.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium shadow-sm"
          >
            Se connecter
          </Link>
          <ul className="mt-10 space-y-3 text-left text-zinc-600 text-sm">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Chargement de vos donnees...</p>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">{error || 'Impossible de charger votre compte.'}</p>
      </div>
    );
  }

  const site = account.prospect?.generatedSite;
  const deploymentStatus = site?.deploymentStatus || 'PENDING';
  const planLabel =
    account.subscriptionPlan === 'YEARLY'
      ? `Annuel -- ${formatCurrency(299.99)}/an`
      : account.subscriptionPlan === 'MONTHLY'
        ? `Mensuel -- ${formatCurrency(29.99)}/mois`
        : 'Aucun forfait';

  const billingDateLabel = (() => {
    if (account.subscriptionStatus === 'TRIAL' && account.trialEndsAt) {
      return `Essai jusqu'au ${new Date(account.trialEndsAt).toLocaleDateString('fr-FR')}`;
    }
    if (account.currentPeriodEndsAt) {
      return `Prochain paiement le ${new Date(account.currentPeriodEndsAt).toLocaleDateString('fr-FR')}`;
    }
    return null;
  })();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Bienvenue, {account.businessName}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mon Site */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Mon Site</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                deploymentStatusColors[deploymentStatus] || 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {deploymentStatusLabels[deploymentStatus] || deploymentStatus}
            </span>
          </div>
          {site?.deploymentUrl ? (
            <p className="text-sm text-zinc-600 mb-4 break-all">
              <a
                href={site.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                {site.deploymentUrl}
              </a>
            </p>
          ) : (
            <p className="text-sm text-zinc-400 mb-4">Site en cours de preparation</p>
          )}
          <Link
            href="/site"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Voir mon site
          </Link>
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Abonnement</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                subscriptionStatusColors[account.subscriptionStatus] || 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {subscriptionStatusLabels[account.subscriptionStatus] || account.subscriptionStatus}
            </span>
          </div>
          <p className="text-sm text-zinc-900 mb-2">{planLabel}</p>
          {billingDateLabel && (
            <p className="text-sm text-zinc-500">{billingDateLabel}</p>
          )}
        </div>

        {/* Domaine */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Domaine</h2>
          {account.customDomain ? (
            <p className="text-sm text-zinc-900 mb-4">{account.customDomain}</p>
          ) : (
            <p className="text-sm text-zinc-400 mb-4">Non configure</p>
          )}
          <Link
            href="/domain"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Configurer le domaine
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalHome;
