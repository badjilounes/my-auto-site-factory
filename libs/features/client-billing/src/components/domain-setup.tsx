'use client';

import React, { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DomainSetupProps {
  currentDomain: string | null;
  vercelUrl: string | null;
  onSaveDomain: (domain: string) => Promise<boolean>;
  saving?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DomainSetup({
  currentDomain,
  vercelUrl,
  onSaveDomain,
  saving,
}: DomainSetupProps) {
  const [domain, setDomain] = useState(currentDomain ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain name');
      return;
    }

    setError(null);
    setSaved(false);

    const success = await onSaveDomain(domain.trim());
    if (success) {
      setSaved(true);
    } else {
      setError('Failed to save domain. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Custom Domain
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Connect your own domain name to your generated website.
      </p>

      {/* Current site URL */}
      {vercelUrl && (
        <div className="mb-6 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">
            Current Site URL
          </p>
          <a
            href={vercelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {vercelUrl}
          </a>
        </div>
      )}

      {/* Domain Input */}
      <div className="mb-6">
        <label
          htmlFor="custom-domain"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Custom Domain
        </label>
        <div className="flex items-center gap-2">
          <input
            id="custom-domain"
            type="text"
            placeholder="www.my-restaurant.com"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setSaved(false);
              setError(null);
            }}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        {saved && (
          <p className="text-sm text-green-600 mt-1">
            Domain saved successfully. Follow the DNS instructions below.
          </p>
        )}
      </div>

      {/* DNS Instructions */}
      {domain.trim() && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">
              DNS Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add the following DNS records at your domain registrar
            </p>
          </div>
          <div className="p-4 space-y-4">
            {/* A Record */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Option 1: A Record (for apex/root domain)
              </p>
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">Type:</span>
                  <span className="text-slate-900 font-semibold">A</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">Name:</span>
                  <span className="text-slate-900">@</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">Value:</span>
                  <span className="text-slate-900">76.76.21.21</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">TTL:</span>
                  <span className="text-slate-900">3600</span>
                </div>
              </div>
            </div>

            {/* CNAME Record */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Option 2: CNAME Record (for subdomains like www)
              </p>
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">Type:</span>
                  <span className="text-slate-900 font-semibold">CNAME</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">Name:</span>
                  <span className="text-slate-900">www</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">Value:</span>
                  <span className="text-slate-900">cname.vercel-dns.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-16">TTL:</span>
                  <span className="text-slate-900">3600</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                DNS changes can take up to 48 hours to propagate. Your custom
                domain will be verified automatically once the DNS records are
                configured correctly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
