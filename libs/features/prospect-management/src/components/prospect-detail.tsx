'use client';

import React from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface GeneratedSite {
  id: string;
  vercelUrl: string | null;
  repositoryUrl: string | null;
  deploymentStatus: string;
}

interface Prospect {
  id: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  website: string | null;
  uberEatsUrl: string | null;
  deliverooUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  cuisine: string | null;
  openingHours: Record<string, string> | null;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  generatedSite?: GeneratedSite | null;
}

export interface ProspectDetailProps {
  prospect: Prospect;
  loading?: boolean;
  onGenerateSite?: () => void;
  onSendOutreach?: () => void;
  onBack?: () => void;
  generatingLoading?: boolean;
  outreachLoading?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-2">
      <dt className="w-40 flex-shrink-0 text-sm font-medium text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProspectDetail({
  prospect,
  loading,
  onGenerateSite,
  onSendOutreach,
  onBack,
  generatingLoading,
  outreachLoading,
}: ProspectDetailProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading prospect details...</p>
      </div>
    );
  }

  const statusStyle =
    statusStyles[prospect.status] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              &larr; Back
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {prospect.businessName}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {prospect.cuisine ?? 'Restaurant'} &middot;{' '}
              {prospect.city ?? 'Unknown city'}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}
        >
          {prospect.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onGenerateSite &&
          ['NEW', 'ENRICHED'].includes(prospect.status) && (
            <button
              onClick={onGenerateSite}
              disabled={generatingLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {generatingLoading ? 'Generating...' : 'Generate Site'}
            </button>
          )}
        {onSendOutreach && prospect.status === 'SITE_DEPLOYED' && (
          <button
            onClick={onSendOutreach}
            disabled={outreachLoading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {outreachLoading ? 'Sending...' : 'Send Outreach'}
          </button>
        )}
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Business Information
        </h2>
        <dl className="divide-y divide-slate-100">
          <InfoRow label="Business Name" value={prospect.businessName} />
          <InfoRow label="Email" value={prospect.email} />
          <InfoRow label="Phone" value={prospect.phone} />
          <InfoRow label="Address" value={prospect.address} />
          <InfoRow label="City" value={prospect.city} />
          <InfoRow label="Postal Code" value={prospect.postalCode} />
          <InfoRow label="Cuisine" value={prospect.cuisine} />
          <InfoRow label="Price Range" value={prospect.priceRange} />
          <InfoRow
            label="Rating"
            value={
              prospect.rating != null
                ? `${prospect.rating.toFixed(1)} (${prospect.reviewCount ?? 0} reviews)`
                : null
            }
          />
          <InfoRow label="Description" value={prospect.description} />
          <InfoRow
            label="Website"
            value={
              prospect.website ? (
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {prospect.website}
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Uber Eats"
            value={
              prospect.uberEatsUrl ? (
                <a
                  href={prospect.uberEatsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on Uber Eats
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Deliveroo"
            value={
              prospect.deliverooUrl ? (
                <a
                  href={prospect.deliverooUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on Deliveroo
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Opening Hours"
            value={
              prospect.openingHours ? (
                <ul className="space-y-0.5">
                  {Object.entries(prospect.openingHours).map(([day, hours]) => (
                    <li key={day} className="text-sm">
                      <span className="font-medium">{day}:</span> {hours}
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
          <InfoRow
            label="Created"
            value={new Date(prospect.createdAt).toLocaleDateString()}
          />
        </dl>
      </div>

      {/* Generated Site Preview */}
      {prospect.generatedSite && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Generated Site
          </h2>
          <dl className="divide-y divide-slate-100 mb-4">
            <InfoRow
              label="Status"
              value={prospect.generatedSite.deploymentStatus}
            />
            <InfoRow
              label="Live URL"
              value={
                prospect.generatedSite.vercelUrl ? (
                  <a
                    href={prospect.generatedSite.vercelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {prospect.generatedSite.vercelUrl}
                  </a>
                ) : (
                  'Not deployed yet'
                )
              }
            />
            <InfoRow
              label="Repository"
              value={
                prospect.generatedSite.repositoryUrl ? (
                  <a
                    href={prospect.generatedSite.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View on GitHub
                  </a>
                ) : null
              }
            />
          </dl>

          {prospect.generatedSite.vercelUrl && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <iframe
                src={prospect.generatedSite.vercelUrl}
                title={`Site preview for ${prospect.businessName}`}
                className="w-full h-[400px] border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
