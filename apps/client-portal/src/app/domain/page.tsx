'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { getMyAccount, updateDomain, verifyDomain } from '../../lib/api';

type ClientAccount = Awaited<ReturnType<typeof getMyAccount>>;

export function DomainPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [account, setAccount] = React.useState<ClientAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [domainInput, setDomainInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [domainVerified, setDomainVerified] = React.useState<boolean | null>(null);
  const [message, setMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        const data = await getMyAccount();
        setAccount(data);
        if (data.customDomain) {
          setDomainInput(data.customDomain);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session, sessionStatus]);

  async function handleSaveDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setSaving(true);
    setMessage(null);
    setDomainVerified(null);
    try {
      const result = await updateDomain(domainInput.trim());
      setDomainVerified(result.verified);
      setMessage({
        type: 'success',
        text: 'Domaine enregistre. Configurez les enregistrements DNS ci-dessous puis lancez la verification.',
      });
      // Refresh account data
      const data = await getMyAccount();
      setAccount(data);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Impossible d\'enregistrer le domaine.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setMessage(null);
    try {
      const result = await verifyDomain();
      setDomainVerified(result.verified);
      if (result.verified) {
        setMessage({
          type: 'success',
          text: 'Domaine verifie avec succes !',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'La verification a echoue. Verifiez vos parametres DNS et reessayez.',
        });
      }
      // Refresh account data
      const data = await getMyAccount();
      setAccount(data);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'La demande de verification a echoue.',
      });
    } finally {
      setVerifying(false);
    }
  }

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Chargement des parametres de domaine...</p>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">{error || 'Impossible de charger les donnees.'}</p>
      </div>
    );
  }

  const site = account.prospect?.generatedSite;
  const isApex = domainInput && !domainInput.startsWith('www.');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Nom de domaine</h1>
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

      {/* Current Domain Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Domaine actuel</h2>
        {account.customDomain ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-900 font-medium">{account.customDomain}</p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                domainVerified === true
                  ? 'bg-green-100 text-green-700'
                  : domainVerified === false
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {domainVerified === true
                ? 'Verifie'
                : domainVerified === false
                  ? 'Non verifie'
                  : 'En attente de verification'}
            </span>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Aucun domaine personnalise configure</p>
        )}
      </div>

      {/* Domain Form */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          {account.customDomain ? 'Modifier le domaine' : 'Configurer un domaine'}
        </h2>
        <form onSubmit={handleSaveDomain} className="flex items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="domain-input"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Nom de domaine
            </label>
            <input
              id="domain-input"
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="monsuperrestaurant.fr"
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
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Configuration DNS
        </h2>
        <p className="text-sm text-zinc-600 mb-4">
          Pour lier votre domaine, ajoutez l&apos;enregistrement suivant chez votre registrar :
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Valeur
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isApex ? (
                <tr>
                  <td className="px-4 py-3 font-mono text-zinc-900">A</td>
                  <td className="px-4 py-3 font-mono text-zinc-900">@</td>
                  <td className="px-4 py-3 font-mono text-blue-600">76.76.21.21</td>
                </tr>
              ) : (
                <tr>
                  <td className="px-4 py-3 font-mono text-zinc-900">CNAME</td>
                  <td className="px-4 py-3 font-mono text-zinc-900">www</td>
                  <td className="px-4 py-3 font-mono text-blue-600">cname.vercel-dns.com</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || !account.customDomain}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? 'Verification en cours...' : 'Verifier la configuration'}
        </button>
      </div>

      {/* Default URL Card */}
      {site?.deploymentUrl && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">URL par defaut</h2>
          <p className="text-sm text-zinc-600">
            Votre site est accessible a l&apos;adresse :{' '}
            <a
              href={site.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              {site.deploymentUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default DomainPage;
