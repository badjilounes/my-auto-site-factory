'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@my-auto-site-factory/shared-ui';
import {
  getProspect,
  triggerSiteGeneration,
  triggerOutreach,
  updateProspectStatus,
} from '../../../lib/api';

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 mt-0.5">{children}</dd>
    </div>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 transition-colors underline"
    >
      {children}
    </a>
  );
}

export function ProspectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [prospect, setProspect] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [alert, setAlert] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const data = await getProspect(id);
        if (!cancelled) setProspect(data);
      } catch {
        // handled by loading state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function showAlert(type: 'success' | 'error', message: string) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  async function handleGenerateSite() {
    setActionLoading('generate');
    try {
      const result = await triggerSiteGeneration(id);
      showAlert('success', result.message);
      const updated = await getProspect(id);
      setProspect(updated);
    } catch (err: any) {
      showAlert('error', err.message || 'Erreur lors de la generation');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendOutreach() {
    setActionLoading('outreach');
    try {
      const result = await triggerOutreach(id);
      showAlert('success', result.message);
      const updated = await getProspect(id);
      setProspect(updated);
    } catch (err: any) {
      showAlert('error', err.message || "Erreur lors de l'envoi");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkClient() {
    setActionLoading('client');
    try {
      await updateProspectStatus(id, 'CLIENT');
      showAlert('success', 'Prospect marque comme client');
      const updated = await getProspect(id);
      setProspect(updated);
    } catch (err: any) {
      showAlert('error', err.message || 'Erreur lors de la mise a jour');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 h-96 animate-pulse" />
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-400 mb-4">Prospect introuvable</p>
        <Link
          href="/prospects"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Retour aux prospects
        </Link>
      </div>
    );
  }

  const showGenerate =
    prospect.status === 'NEW' || prospect.status === 'ENRICHED';
  const showOutreach = prospect.status === 'SITE_DEPLOYED';
  const showMarkClient =
    prospect.status === 'OUTREACH_SENT' || prospect.status === 'INTERESTED';

  const site = prospect.generatedSite;
  const openingHours = prospect.openingHours as Record<string, string> | null;

  return (
    <div>
      {/* Alert */}
      {alert && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-2 text-sm">
        <Link
          href="/prospects"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          Prospects
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium">{prospect.businessName}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {prospect.businessName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={prospect.status} />
            <span className="text-sm text-slate-500">
              Cree le{' '}
              {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {showGenerate && (
            <button
              onClick={handleGenerateSite}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'generate'
                ? 'Generation...'
                : 'Generer le site'}
            </button>
          )}
          {showOutreach && (
            <button
              onClick={handleSendOutreach}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'outreach'
                ? 'Envoi...'
                : 'Envoyer email'}
            </button>
          )}
          {showMarkClient && (
            <button
              onClick={handleMarkClient}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'client'
                ? 'Mise a jour...'
                : 'Marquer client'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Business Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Informations
            </h2>
            <dl className="space-y-3">
              <InfoRow label="Proprietaire">
                {prospect.ownerName || 'Non renseigne'}
              </InfoRow>
              <InfoRow label="Email">
                {prospect.email ? (
                  <a
                    href={`mailto:${prospect.email}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {prospect.email}
                  </a>
                ) : (
                  'Non renseigne'
                )}
              </InfoRow>
              <InfoRow label="Telephone">
                {prospect.phone ? (
                  <a
                    href={`tel:${prospect.phone}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {prospect.phone}
                  </a>
                ) : (
                  'Non renseigne'
                )}
              </InfoRow>
              <InfoRow label="Adresse">
                {prospect.address || 'Non renseigne'}
              </InfoRow>
              <InfoRow label="Code postal">
                {prospect.postalCode || 'Non renseigne'}
              </InfoRow>

              <div className="border-t border-slate-100 pt-3" />

              <InfoRow label="Site web">
                {prospect.website ? (
                  <ExternalLink href={prospect.website}>
                    {prospect.website}
                  </ExternalLink>
                ) : (
                  'Non renseigne'
                )}
              </InfoRow>
              <InfoRow label="UberEats">
                {prospect.uberEatsUrl ? (
                  <ExternalLink href={prospect.uberEatsUrl}>
                    Voir sur UberEats
                  </ExternalLink>
                ) : (
                  'Non renseigne'
                )}
              </InfoRow>
              <InfoRow label="Deliveroo">
                {prospect.deliverooUrl ? (
                  <ExternalLink href={prospect.deliverooUrl}>
                    Voir sur Deliveroo
                  </ExternalLink>
                ) : (
                  'Non renseigne'
                )}
              </InfoRow>

              <div className="border-t border-slate-100 pt-3" />

              <InfoRow label="Cuisine">
                {prospect.cuisineType || 'Non renseigne'}
              </InfoRow>
              <InfoRow label="Note">
                {prospect.rating != null
                  ? `${prospect.rating}/5${prospect.reviewCount != null ? ` (${prospect.reviewCount} avis)` : ''}`
                  : 'Non renseigne'}
              </InfoRow>
              <InfoRow label="Gamme de prix">
                {prospect.priceRange || 'Non renseigne'}
              </InfoRow>

              {/* Opening Hours */}
              {openingHours && Object.keys(openingHours).length > 0 && (
                <>
                  <div className="border-t border-slate-100 pt-3" />
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Horaires d&apos;ouverture
                    </dt>
                    <dd>
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(openingHours).map(([day, hours]) => (
                            <tr key={day}>
                              <td className="py-0.5 text-slate-600 font-medium pr-3">
                                {day}
                              </td>
                              <td className="py-0.5 text-slate-900">
                                {hours}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </dd>
                  </div>
                </>
              )}

              <div className="border-t border-slate-100 pt-3" />

              <InfoRow label="Source">
                {prospect.source || 'Non renseigne'}
              </InfoRow>
              <InfoRow label="Date creation">
                {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}
              </InfoRow>
              <InfoRow label="Derniere mise a jour">
                {new Date(prospect.updatedAt).toLocaleDateString('fr-FR')}
              </InfoRow>
            </dl>
          </div>
        </div>

        {/* RIGHT COLUMN - Site Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Apercu du site
              </h2>
              {site && (
                <div className="flex items-center gap-3">
                  <StatusBadge status={site.deploymentStatus} />
                  {site.deploymentUrl && (
                    <a
                      href={site.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Ouvrir le site
                    </a>
                  )}
                  {site.githubRepoUrl && (
                    <a
                      href={site.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              )}
            </div>

            {site && site.deploymentUrl ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <iframe
                  src={site.deploymentUrl}
                  className="w-full h-[600px]"
                  title={`Apercu du site de ${prospect.businessName}`}
                />
              </div>
            ) : site && site.generatedCode ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={site.generatedCode}
                  className="w-full h-[600px]"
                  title={`Apercu HTML de ${prospect.businessName}`}
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-lg flex items-center justify-center h-[400px] bg-slate-50">
                <div className="text-center">
                  <p className="text-slate-400 mb-3">Aucun site genere</p>
                  {showGenerate && (
                    <button
                      onClick={handleGenerateSite}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Generer maintenant
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Outreach Emails */}
          {prospect.outreachEmails && prospect.outreachEmails.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Emails de demarchage
              </h2>
              <div className="space-y-3">
                {prospect.outreachEmails.map((email: any) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {email.subject}
                      </p>
                      {email.sentAt && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Envoye le{' '}
                          {new Date(email.sentAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={email.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProspectDetailPage;
