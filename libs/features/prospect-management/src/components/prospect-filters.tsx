'use client';

import React from 'react';

export interface ProspectFiltersValues {
  status: string;
  city: string;
  search: string;
}

export interface ProspectFiltersProps {
  values: ProspectFiltersValues;
  onChange: (values: ProspectFiltersValues) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'ENRICHED', label: 'Enriched' },
  { value: 'SITE_GENERATING', label: 'Site Generating' },
  { value: 'SITE_GENERATED', label: 'Site Generated' },
  { value: 'SITE_DEPLOYED', label: 'Site Deployed' },
  { value: 'OUTREACH_SENT', label: 'Outreach Sent' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function ProspectFilters({ values, onChange, onClear }: ProspectFiltersProps) {
  const handleChange = (field: keyof ProspectFiltersValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name..."
            value={values.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            City
          </label>
          <input
            type="text"
            placeholder="Filter by city..."
            value={values.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Status
          </label>
          <select
            value={values.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onClear}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
