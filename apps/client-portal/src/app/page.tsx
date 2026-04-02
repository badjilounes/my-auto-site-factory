'use client';

import React from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface ClientDashboard {
  site: {
    url: string | null;
    previewUrl: string | null;
    status: string;
    domain: string | null;
  } | null;
  subscription: {
    plan: string;
    status: string;
    nextBillingDate: string | null;
  } | null;
  recentInvoices: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

export default function ClientPortalHome() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [data, setData] = React.useState<ClientDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_URL}/api/client/dashboard`, {
          credentials: 'include',
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Chargement...</p>
      </div>
    );
  }

  // Not signed in - show hero section
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Bienvenue sur votre Portail Client
          </h1>
          <p className="text-zinc-500 mb-8 text-lg">
            Connectez-vous pour gerer votre site vitrine, consulter votre
            abonnement, configurer votre nom de domaine et suivre votre
            facturation.
          </p>
          <SignInButton mode="modal">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium shadow-sm">
              Se connecter pour commencer
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    deployed: 'bg-green-100 text-green-700',
    building: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    canceled: 'bg-red-100 text-red-700',
    past_due: 'bg-red-100 text-red-700',
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-amber-100 text-amber-700',
  };

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    deployed: 'Deploye',
    building: 'En construction',
    pending: 'En attente',
    canceled: 'Annule',
    past_due: 'En retard',
    paid: 'Paye',
    unpaid: 'Impaye',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Bonjour{user?.firstName ? `, ${user.firstName}` : ''} !
        </h1>
        <p className="text-zinc-500 mt-1">
          Gerez votre site vitrine et votre abonnement depuis votre espace
          client.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-400">Chargement de vos donnees...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Status Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Mon Site</h2>
              {data?.site?.status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[data.site.status] ||
                    'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {statusLabels[data.site.status] || data.site.status}
                </span>
              )}
            </div>
            {data?.site?.previewUrl ? (
              <div className="border border-zinc-200 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={data.site.previewUrl}
                  className="w-full h-48 pointer-events-none"
                  title="Apercu du site"
                />
              </div>
            ) : (
              <div className="border border-dashed border-zinc-300 rounded-lg h-48 flex items-center justify-center bg-zinc-50 mb-4">
                <p className="text-zinc-400 text-sm">
                  Votre site est en cours de preparation
                </p>
              </div>
            )}
            <Link
              href="/site"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Voir l&apos;apercu complet &rarr;
            </Link>
          </div>

          {/* Subscription Status Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Abonnement
              </h2>
              {data?.subscription?.status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[data.subscription.status] ||
                    'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {statusLabels[data.subscription.status] ||
                    data.subscription.status}
                </span>
              )}
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Forfait actuel
                </p>
                <p className="text-sm text-zinc-900 mt-0.5">
                  {data?.subscription?.plan || 'Aucun forfait actif'}
                </p>
              </div>
              {data?.subscription?.nextBillingDate && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Prochaine facturation
                  </p>
                  <p className="text-sm text-zinc-900 mt-0.5">
                    {new Date(
                      data.subscription.nextBillingDate
                    ).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
            <Link
              href="/billing"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Gerer la facturation &rarr;
            </Link>
          </div>

          {/* Domain Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Domaine
            </h2>
            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Domaine personnalise
              </p>
              <p className="text-sm text-zinc-900 mt-0.5">
                {data?.site?.domain || 'Non configure'}
              </p>
            </div>
            <Link
              href="/domain"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Configurer le domaine &rarr;
            </Link>
          </div>

          {/* Recent Invoices Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Factures recentes
            </h2>
            {data?.recentInvoices && data.recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {data.recentInvoices.slice(0, 3).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-zinc-900">
                        {(invoice.amount / 100).toFixed(2)} EUR
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[invoice.status] ||
                        'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {statusLabels[invoice.status] || invoice.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Aucune facture</p>
            )}
            <div className="mt-4">
              <Link
                href="/billing"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Voir toutes les factures &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
