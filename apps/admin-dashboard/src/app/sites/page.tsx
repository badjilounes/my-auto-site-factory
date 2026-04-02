'use client';

import React from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface GeneratedSite {
  id: string;
  prospectId: string;
  businessName: string;
  siteUrl: string | null;
  deploymentStatus: string;
  repositoryUrl: string | null;
  domain: string | null;
  createdAt: string;
  deployedAt: string | null;
}

const deploymentStatusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  building: 'bg-blue-100 text-blue-700',
  deployed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function SitesPage() {
  const [sites, setSites] = React.useState<GeneratedSite[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch(`${API_URL}/api/sites`);
        if (res.ok) {
          setSites(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Generated Sites</h1>
        <p className="text-slate-500 mt-1">
          All generated restaurant sites and their deployment status
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Business Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Domain
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Loading sites...
                </td>
              </tr>
            ) : sites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No sites generated yet
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr
                  key={site.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/prospects/${site.prospectId}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {site.businessName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        deploymentStatusColors[site.deploymentStatus] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {site.deploymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {site.domain || site.siteUrl || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {site.siteUrl && (
                        <a
                          href={site.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Visit
                        </a>
                      )}
                      {site.repositoryUrl && (
                        <a
                          href={site.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                          Repo
                        </a>
                      )}
                      <Link
                        href={`/prospects/${site.prospectId}`}
                        className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
