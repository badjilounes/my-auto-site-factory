'use client';

import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface BillingInfo {
  subscription: {
    plan: string;
    status: string;
    amount: number;
    interval: 'month' | 'year';
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    pdfUrl: string | null;
  }>;
}

const invoiceStatusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  open: 'bg-amber-100 text-amber-700',
  draft: 'bg-zinc-100 text-zinc-700',
  void: 'bg-red-100 text-red-700',
  uncollectible: 'bg-red-100 text-red-700',
};

const invoiceStatusLabels: Record<string, string> = {
  paid: 'Payee',
  open: 'En attente',
  draft: 'Brouillon',
  void: 'Annulee',
  uncollectible: 'Irrecouvrable',
};

export default function BillingPage() {
  const [billing, setBilling] = React.useState<BillingInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch(`${API_URL}/api/client/billing`, {
          credentials: 'include',
        });
        if (res.ok) {
          setBilling(await res.json());
        }
      } catch (error) {
        console.error(
          'Erreur lors du chargement des informations de facturation:',
          error
        );
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      const res = await fetch(`${API_URL}/api/client/billing/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          window.location.href = result.url;
        } else {
          const billingRes = await fetch(`${API_URL}/api/client/billing`, {
            credentials: 'include',
          });
          if (billingRes.ok) {
            setBilling(await billingRes.json());
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">
          Chargement des informations de facturation...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Facturation</h1>
        <p className="text-zinc-500 mt-1">
          Gerez votre abonnement et consultez vos factures
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mensuel */}
        <div
          className={`bg-white rounded-xl border shadow-sm p-6 ${
            billing?.subscription?.interval === 'month'
              ? 'border-blue-600 ring-2 ring-blue-100'
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-zinc-900">
              Forfait Mensuel
            </h2>
            {billing?.subscription?.interval === 'month' && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                Forfait actuel
              </span>
            )}
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold text-zinc-900">29,99</span>
            <span className="text-zinc-500 ml-1">EUR / mois</span>
          </div>
          <ul className="space-y-2 mb-6 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Site vitrine professionnel
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Hebergement inclus
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Nom de domaine personnalise
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Support par email
            </li>
          </ul>
          {billing?.subscription?.interval !== 'month' && (
            <button
              onClick={() => handleAction('subscribe-monthly')}
              disabled={actionLoading === 'subscribe-monthly'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {actionLoading === 'subscribe-monthly'
                ? 'Chargement...'
                : 'Choisir le forfait mensuel'}
            </button>
          )}
        </div>

        {/* Annuel */}
        <div
          className={`bg-white rounded-xl border shadow-sm p-6 ${
            billing?.subscription?.interval === 'year'
              ? 'border-blue-600 ring-2 ring-blue-100'
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-zinc-900">
              Forfait Annuel
            </h2>
            {billing?.subscription?.interval === 'year' ? (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                Forfait actuel
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                -17%
              </span>
            )}
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold text-zinc-900">299,99</span>
            <span className="text-zinc-500 ml-1">EUR / an</span>
          </div>
          <ul className="space-y-2 mb-6 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Tout le forfait mensuel inclus
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              2 mois offerts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Support prioritaire
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">&#10003;</span>
              Mises a jour prioritaires
            </li>
          </ul>
          {billing?.subscription?.interval !== 'year' && (
            <button
              onClick={() => handleAction('subscribe-yearly')}
              disabled={actionLoading === 'subscribe-yearly'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {actionLoading === 'subscribe-yearly'
                ? 'Chargement...'
                : 'Choisir le forfait annuel'}
            </button>
          )}
        </div>
      </div>

      {/* Current Subscription Details */}
      {billing?.subscription && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Details de l&apos;abonnement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Statut
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                  billing.subscription.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : billing.subscription.status === 'past_due'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {billing.subscription.status === 'active'
                  ? 'Actif'
                  : billing.subscription.status === 'past_due'
                    ? 'En retard'
                    : billing.subscription.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Montant
              </p>
              <p className="text-sm text-zinc-900 mt-1">
                {(billing.subscription.amount / 100).toFixed(2)} EUR /{' '}
                {billing.subscription.interval === 'month' ? 'mois' : 'an'}
              </p>
            </div>
            {billing.subscription.nextBillingDate && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Prochaine facturation
                </p>
                <p className="text-sm text-zinc-900 mt-1">
                  {new Date(
                    billing.subscription.nextBillingDate
                  ).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
          {billing.subscription.cancelAtPeriodEnd && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                Votre abonnement sera annule a la fin de la periode de
                facturation en cours.
              </p>
            </div>
          )}
          {!billing.subscription.cancelAtPeriodEnd && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading === 'cancel'}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {actionLoading === 'cancel'
                ? 'Annulation...'
                : "Annuler l'abonnement"}
            </button>
          )}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Factures</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Facture
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {!billing?.invoices || billing.invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-400"
                  >
                    Aucune facture pour le moment
                  </td>
                </tr>
              ) : (
                billing.invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-900">
                      {new Date(invoice.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 font-medium">
                      {(invoice.amount / 100).toFixed(2)} EUR
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          invoiceStatusColors[invoice.status] ||
                          'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {invoiceStatusLabels[invoice.status] || invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Telecharger PDF
                        </a>
                      ) : (
                        <span className="text-sm text-zinc-400">-</span>
                      )}
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
