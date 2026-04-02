'use client';

import React from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Prospect {
  id: string;
  businessName: string;
  city: string | null;
  cuisine: string | null;
  status: string;
  email: string | null;
  rating: number | null;
  createdAt: string;
}

export interface ProspectListProps {
  prospects: Prospect[];
  loading: boolean;
  onSelect: (id: string) => void;
  onGenerateSite?: (id: string) => void;
  onSendOutreach?: (id: string) => void;
}

// ─── Status Badge Colors ────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  ENRICHED: 'bg-cyan-100 text-cyan-700',
  SITE_GENERATING: 'bg-yellow-100 text-yellow-700',
  SITE_GENERATED: 'bg-emerald-100 text-emerald-700',
  SITE_DEPLOYED: 'bg-green-100 text-green-700',
  OUTREACH_SENT: 'bg-amber-100 text-amber-700',
  INTERESTED: 'bg-violet-100 text-violet-700',
  CLIENT: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProspectList({
  prospects,
  loading,
  onSelect,
  onGenerateSite,
  onSendOutreach,
}: ProspectListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Business Name
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              City
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cuisine
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rating
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                Loading prospects...
              </td>
            </tr>
          ) : prospects.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                No prospects found
              </td>
            </tr>
          ) : (
            prospects.map((prospect) => (
              <tr
                key={prospect.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <button
                    onClick={() => onSelect(prospect.id)}
                    className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors text-left"
                  >
                    {prospect.businessName}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {prospect.city ?? '-'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {prospect.cuisine ?? '-'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {prospect.rating != null ? prospect.rating.toFixed(1) : '-'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={prospect.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelect(prospect.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      View
                    </button>
                    {onGenerateSite &&
                      ['NEW', 'ENRICHED'].includes(prospect.status) && (
                        <button
                          onClick={() => onGenerateSite(prospect.id)}
                          className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                        >
                          Generate
                        </button>
                      )}
                    {onSendOutreach &&
                      prospect.status === 'SITE_DEPLOYED' && (
                        <button
                          onClick={() => onSendOutreach(prospect.id)}
                          className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
                        >
                          Outreach
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
