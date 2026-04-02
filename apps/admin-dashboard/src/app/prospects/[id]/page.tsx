'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface ProspectDetail {
  id: string;
  businessName: string;
  city: string;
  state: string;
  cuisine: string;
  status: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  rating: number;
  reviewCount: number;
  scrapedData: Record<string, unknown> | null;
  siteUrl: string | null;
  sitePreviewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  scraped: 'bg-cyan-100 text-cyan-700',
  site_generated: 'bg-green-100 text-green-700',
  outreach_sent: 'bg-amber-100 text-amber-700',
  client: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ProspectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [prospect, setProspect] = React.useState<ProspectDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProspect() {
      try {
        const res = await fetch(`${API_URL}/api/prospects/${id}`);
        if (res.ok) {
          setProspect(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch prospect:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProspect();
  }, [id]);

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      const res = await fetch(`${API_URL}/api/prospects/${id}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        const updated = await res.json();
        setProspect(updated);
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Loading prospect...</p>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-400 mb-4">Prospect not found</p>
        <Link
          href="/prospects"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Back to Prospects
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/prospects"
              className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
            >
              Prospects
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-600">
              {prospect.businessName}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {prospect.businessName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[prospect.status] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {prospect.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-slate-500">
              Added {new Date(prospect.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction('generate-site')}
            disabled={actionLoading === 'generate-site'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'generate-site'
              ? 'Generating...'
              : 'Generate Site'}
          </button>
          <button
            onClick={() => handleAction('send-outreach')}
            disabled={actionLoading === 'send-outreach'}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'send-outreach'
              ? 'Sending...'
              : 'Send Outreach'}
          </button>
          <button
            onClick={() => handleAction('mark-client')}
            disabled={actionLoading === 'mark-client'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'mark-client'
              ? 'Updating...'
              : 'Mark as Client'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Business Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  City
                </dt>
                <dd className="text-sm text-slate-900 mt-0.5">
                  {prospect.city}
                  {prospect.state ? `, ${prospect.state}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cuisine
                </dt>
                <dd className="text-sm text-slate-900 mt-0.5">
                  {prospect.cuisine}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Address
                </dt>
                <dd className="text-sm text-slate-900 mt-0.5">
                  {prospect.address || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Phone
                </dt>
                <dd className="text-sm text-slate-900 mt-0.5">
                  {prospect.phone || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </dt>
                <dd className="text-sm text-slate-900 mt-0.5">
                  {prospect.email || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Website
                </dt>
                <dd className="text-sm mt-0.5">
                  {prospect.website ? (
                    <a
                      href={prospect.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {prospect.website}
                    </a>
                  ) : (
                    <span className="text-slate-900">N/A</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rating
                </dt>
                <dd className="text-sm text-slate-900 mt-0.5">
                  {prospect.rating
                    ? `${prospect.rating}/5 (${prospect.reviewCount} reviews)`
                    : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Scraped Data */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Scraped Data
            </h2>
            {prospect.scrapedData ? (
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-auto max-h-80">
                {JSON.stringify(prospect.scrapedData, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-400">No scraped data available</p>
            )}
          </div>
        </div>

        {/* Site Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Generated Site Preview
              </h2>
              {prospect.siteUrl && (
                <a
                  href={prospect.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Open in new tab
                </a>
              )}
            </div>
            {prospect.sitePreviewUrl ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <iframe
                  src={prospect.sitePreviewUrl}
                  className="w-full h-[600px]"
                  title={`Site preview for ${prospect.businessName}`}
                />
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-lg flex items-center justify-center h-[400px] bg-slate-50">
                <div className="text-center">
                  <p className="text-slate-400 mb-3">
                    No site generated yet
                  </p>
                  <button
                    onClick={() => handleAction('generate-site')}
                    disabled={actionLoading === 'generate-site'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Generate Site Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
