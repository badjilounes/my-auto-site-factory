'use client';

import React from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BillingInfo {
  clientAccountId: string;
  email: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  stripeCustomerId: string | null;
  customDomain: string | null;
  currentPeriodEndsAt: string | null;
  trialEndsAt: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
}

interface Subscription {
  id: string;
  status: string;
  plan: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingDashboardProps {
  billingInfo: BillingInfo | null;
  invoices: Invoice[];
  subscription: Subscription | null;
  loading: boolean;
  onManagePayment?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const subscriptionStatusStyles: Record<string, string> = {
  TRIAL: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-100 text-slate-700',
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BillingDashboard({
  billingInfo,
  invoices,
  subscription,
  loading,
  onManagePayment,
}: BillingDashboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading billing information...</p>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">No billing information available.</p>
      </div>
    );
  }

  const subStatusStyle =
    subscriptionStatusStyles[billingInfo.subscriptionStatus] ??
    'bg-slate-100 text-slate-700';

  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter((inv) => ['SENT', 'DRAFT', 'OVERDUE'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subscription Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Subscription
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${subStatusStyle}`}
            >
              {billingInfo.subscriptionStatus}
            </span>
            {billingInfo.subscriptionPlan && (
              <span className="text-sm text-slate-600">
                ({billingInfo.subscriptionPlan})
              </span>
            )}
          </div>
          {billingInfo.subscriptionStatus === 'TRIAL' &&
            billingInfo.trialEndsAt && (
              <p className="text-xs text-slate-500 mt-2">
                Trial ends: {formatDate(billingInfo.trialEndsAt)}
              </p>
            )}
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-slate-500 mt-2">
              Current period ends: {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <p className="text-xs text-amber-600 mt-1">
              Cancels at end of current period
            </p>
          )}
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Total Paid
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalPaid, 'EUR')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {invoices.filter((inv) => inv.status === 'PAID').length} invoices
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Pending Amount
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(pendingAmount, 'EUR')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {invoices.filter((inv) => ['SENT', 'DRAFT', 'OVERDUE'].includes(inv.status)).length}{' '}
            outstanding
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Payment Details
          </h2>
          {onManagePayment && (
            <button
              onClick={onManagePayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Manage Payment Method
            </button>
          )}
        </div>
        <dl className="divide-y divide-slate-100">
          <div className="flex items-center py-2">
            <dt className="w-40 text-sm font-medium text-slate-500">Email</dt>
            <dd className="text-sm text-slate-900">{billingInfo.email}</dd>
          </div>
          <div className="flex items-center py-2">
            <dt className="w-40 text-sm font-medium text-slate-500">
              Stripe Customer
            </dt>
            <dd className="text-sm text-slate-900">
              {billingInfo.stripeCustomerId ?? 'Not connected'}
            </dd>
          </div>
          <div className="flex items-center py-2">
            <dt className="w-40 text-sm font-medium text-slate-500">
              Custom Domain
            </dt>
            <dd className="text-sm text-slate-900">
              {billingInfo.customDomain ?? 'Not configured'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Invoices
        </h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            No invoices yet
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase">
                  Amount
                </th>
                <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
                <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase">
                  Due Date
                </th>
                <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase">
                  Paid
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 text-sm font-medium text-slate-900">
                    {formatCurrency(inv.amount, inv.currency)}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2 text-sm text-slate-600">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="py-2 text-sm text-slate-600">
                    {formatDate(inv.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
