'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { getMyAccount } from '../../lib/api';

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

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-zinc-100 text-zinc-700',
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyee',
  PAID: 'Payee',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulee',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

export function BillingPage() {
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
        <p className="text-zinc-400">Chargement des informations de facturation...</p>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">{error || 'Impossible de charger les donnees.'}</p>
      </div>
    );
  }

  const planLabel =
    account.subscriptionPlan === 'YEARLY'
      ? `Annuel -- ${formatCurrency(299.99)}/an`
      : account.subscriptionPlan === 'MONTHLY'
        ? `Mensuel -- ${formatCurrency(29.99)}/mois`
        : 'Aucun forfait';

  const daysRemaining = (() => {
    if (account.subscriptionStatus === 'TRIAL' && account.trialEndsAt) {
      const diff = new Date(account.trialEndsAt).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return null;
  })();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Facturation</h1>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Forfait actuel</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              subscriptionStatusColors[account.subscriptionStatus] || 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {subscriptionStatusLabels[account.subscriptionStatus] || account.subscriptionStatus}
          </span>
        </div>

        <p className="text-xl font-semibold text-zinc-900 mb-3">{planLabel}</p>

        {account.subscriptionStatus === 'TRIAL' && account.trialEndsAt && (
          <p className="text-sm text-amber-700 mb-3">
            Essai gratuit jusqu&apos;au{' '}
            {new Date(account.trialEndsAt).toLocaleDateString('fr-FR')}
            {daysRemaining !== null && ` (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''})`}
          </p>
        )}

        {account.subscriptionStatus === 'ACTIVE' && account.currentPeriodEndsAt && (
          <p className="text-sm text-zinc-500 mb-3">
            Prochain paiement le{' '}
            {new Date(account.currentPeriodEndsAt).toLocaleDateString('fr-FR')}
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Changer de plan
          </button>
          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
            Annuler l&apos;abonnement
          </button>
        </div>
      </div>

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
                  Description
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {account.invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                    Aucune facture pour le moment
                  </td>
                </tr>
              ) : (
                account.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-900">
                      {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {invoice.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          invoiceStatusColors[invoice.status] || 'bg-zinc-100 text-zinc-700'
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
                          Telecharger
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

export default BillingPage;
