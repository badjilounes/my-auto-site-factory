'use client';

import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface DomainInfo {
  customDomain: string | null;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'not_configured';
  defaultUrl: string | null;
  cnameTarget: string;
}

const verificationStatusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  not_configured: 'bg-zinc-100 text-zinc-700',
};

const verificationStatusLabels: Record<string, string> = {
  verified: 'Verifie',
  pending: 'En attente de verification',
  failed: 'Echec de verification',
  not_configured: 'Non configure',
};

export default function DomainPage() {
  const [domainInfo, setDomainInfo] = React.useState<DomainInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [domainInput, setDomainInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function fetchDomain() {
    try {
      const res = await fetch(`${API_URL}/api/client/domain`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDomainInfo(data);
        if (data.customDomain) {
          setDomainInput(data.customDomain);
        }
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des informations de domaine:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchDomain();
  }, []);

  async function handleSaveDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/client/domain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Domaine enregistre. Veuillez configurer l\'enregistrement DNS ci-dessous puis verifier.',
        });
        await fetchDomain();
      } else {
        const err = await res.json();
        setMessage({
          type: 'error',
          text: err.message || 'Impossible d\'enregistrer le domaine.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Impossible d\'enregistrer le domaine.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/client/domain/verify`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const result = await res.json();
        if (result.verified) {
          setMessage({
            type: 'success',
            text: 'Domaine verifie avec succes !',
          });
        } else {
          setMessage({
            type: 'error',
            text: 'La verification a echoue. Veuillez verifier vos parametres DNS et reessayer.',
          });
        }
        await fetchDomain();
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'La demande de verification a echoue.',
      });
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">
          Chargement des parametres de domaine...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Configuration du domaine
        </h1>
        <p className="text-zinc-500 mt-1">
          Configurez un nom de domaine personnalise pour votre site vitrine
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current Status */}
      {domainInfo?.customDomain && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                Domaine actuel
              </h2>
              <p className="text-sm text-zinc-700">
                {domainInfo.customDomain}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  verificationStatusColors[domainInfo.verificationStatus] ||
                  'bg-zinc-100 text-zinc-700'
                }`}
              >
                {verificationStatusLabels[domainInfo.verificationStatus] ||
                  domainInfo.verificationStatus}
              </span>
              {domainInfo.verificationStatus !== 'verified' && (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {verifying ? 'Verification...' : 'Verifier maintenant'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Set Custom Domain */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          {domainInfo?.customDomain ? 'Modifier le' : 'Definir un'} domaine
          personnalise
        </h2>
        <form onSubmit={handleSaveDomain} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nom de domaine
            </label>
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="www.mon-restaurant.fr"
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !domainInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* DNS Instructions */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Instructions de configuration DNS
        </h2>
        <p className="text-sm text-zinc-600 mb-4">
          Pour connecter votre domaine personnalise, ajoutez l&apos;enregistrement
          CNAME suivant dans les parametres DNS de votre registraire de domaine :
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-zinc-200">
          <p className="text-sm font-medium text-zinc-900 mb-3">
            Ajoutez un enregistrement CNAME pointant vers{' '}
            <code className="bg-zinc-200 px-2 py-0.5 rounded text-blue-600 font-mono text-xs">
              cname.vercel-dns.com
            </code>
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Nom / Hote
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Valeur / Cible
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  TTL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 font-mono text-zinc-900">CNAME</td>
                <td className="py-2 px-3 font-mono text-zinc-900">
                  {domainInfo?.customDomain
                    ? domainInfo.customDomain.startsWith('www.')
                      ? 'www'
                      : '@'
                    : 'www'}
                </td>
                <td className="py-2 px-3 font-mono text-blue-600">
                  cname.vercel-dns.com
                </td>
                <td className="py-2 px-3 font-mono text-zinc-900">3600</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900">Etapes :</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600">
            <li>
              Connectez-vous a votre registraire de domaine (ex : OVH,
              Gandi, Cloudflare)
            </li>
            <li>
              Accedez aux parametres DNS de votre domaine
            </li>
            <li>
              Ajoutez un nouvel enregistrement CNAME avec les valeurs
              indiquees ci-dessus
            </li>
            <li>
              Sauvegardez les modifications et attendez jusqu&apos;a 24 heures
              pour la propagation DNS
            </li>
            <li>
              Revenez ici et cliquez sur &laquo; Verifier maintenant &raquo;
              pour confirmer la configuration
            </li>
          </ol>
        </div>

        {domainInfo?.defaultUrl && (
          <div className="mt-6 pt-4 border-t border-zinc-200">
            <p className="text-xs text-zinc-500">
              Votre site est actuellement accessible a l&apos;adresse :{' '}
              <a
                href={domainInfo.defaultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                {domainInfo.defaultUrl}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
