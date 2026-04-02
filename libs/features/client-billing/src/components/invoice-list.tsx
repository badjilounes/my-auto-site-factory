'use client';

import React from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  clientAccountId: string;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    month: 'short',
    day: 'numeric',
  });
}

const invoiceStatusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function InvoiceList({ invoices, loading }: InvoiceListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-sm text-slate-400 text-center py-8">
          Loading invoices...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
      </div>

      {invoices.length === 0 ? (
        <div className="px-6 py-8 text-center text-slate-400 text-sm">
          No invoices found
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Paid At
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => {
              const statusStyle =
                invoiceStatusStyles[invoice.status] ?? 'bg-slate-100 text-slate-700';

              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {invoice.stripeInvoiceId
                        ? invoice.stripeInvoiceId.slice(0, 20) + '...'
                        : invoice.id.slice(0, 12)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(invoice.createdAt)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(invoice.paidAt)}
                  </td>
                  <td className="px-6 py-4">
                    {invoice.pdfUrl ? (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
