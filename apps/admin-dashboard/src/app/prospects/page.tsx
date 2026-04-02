'use client';

import React from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface Prospect {
  id: string;
  businessName: string;
  city: string;
  cuisine: string;
  status: string;
  phone?: string;
  website?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  scraped: 'bg-cyan-100 text-cyan-700',
  site_generated: 'bg-green-100 text-green-700',
  outreach_sent: 'bg-amber-100 text-amber-700',
  client: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ProspectsPage() {
  const [prospects, setProspects] = React.useState<Prospect[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterCity, setFilterCity] = React.useState('');
  const [filterCuisine, setFilterCuisine] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('');

  React.useEffect(() => {
    async function fetchProspects() {
      try {
        const params = new URLSearchParams();
        if (filterCity) params.set('city', filterCity);
        if (filterCuisine) params.set('cuisine', filterCuisine);
        if (filterStatus) params.set('status', filterStatus);
        const res = await fetch(
          `${API_URL}/api/prospects?${params.toString()}`
        );
        if (res.ok) {
          setProspects(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch prospects:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProspects();
  }, [filterCity, filterCuisine, filterStatus]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-slate-500 mt-1">
            Manage restaurant prospects in the pipeline
          </p>
        </div>
        <Link
          href="/scraping"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + New Scraping Job
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="Filter by city..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Cuisine
            </label>
            <input
              type="text"
              placeholder="Filter by cuisine..."
              value={filterCuisine}
              onChange={(e) => setFilterCuisine(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="scraped">Scraped</option>
              <option value="site_generated">Site Generated</option>
              <option value="outreach_sent">Outreach Sent</option>
              <option value="client">Client</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => {
                setFilterCity('');
                setFilterCuisine('');
                setFilterStatus('');
              }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mt-5"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Prospects Table */}
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
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Loading prospects...
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
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
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {prospect.businessName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {prospect.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {prospect.cuisine}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[prospect.status] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {prospect.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      View
                    </Link>
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
