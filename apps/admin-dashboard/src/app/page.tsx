import { getDashboardStats } from '../lib/api';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouveau',
  ENRICHED: 'Enrichi',
  SITE_GENERATED: 'Site genere',
  SITE_DEPLOYED: 'Site deploye',
  OUTREACH_SENT: 'Email envoye',
  INTERESTED: 'Interesse',
  CLIENT: 'Client',
  NOT_INTERESTED: 'Non interesse',
  INVALID: 'Invalide',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-200',
  ENRICHED: 'bg-blue-200',
  SITE_GENERATED: 'bg-indigo-200',
  SITE_DEPLOYED: 'bg-violet-200',
  OUTREACH_SENT: 'bg-amber-200',
  INTERESTED: 'bg-emerald-200',
  CLIENT: 'bg-green-400',
  NOT_INTERESTED: 'bg-red-200',
  INVALID: 'bg-gray-300',
};

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function DashboardPage() {
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null;
  try {
    stats = await getDashboardStats();
  } catch {
    stats = null;
  }

  if (!stats) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Vue d&apos;ensemble de votre pipeline</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">!</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Impossible de charger les statistiques
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Le serveur API est peut-etre indisponible. Verifiez que le backend
            tourne sur le port 3333 et reessayez.
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Prospects',
      value: String(stats.totalProspects),
      accent: 'text-blue-600',
      bg: 'bg-blue-50',
      dot: 'bg-blue-600',
    },
    {
      label: 'Sites deployes',
      value: String(stats.totalSitesDeployed),
      accent: 'text-violet-600',
      bg: 'bg-violet-50',
      dot: 'bg-violet-600',
    },
    {
      label: 'Clients actifs',
      value: String(stats.totalClients),
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
      dot: 'bg-emerald-600',
    },
    {
      label: 'Revenus du mois',
      value: formatEur(stats.monthlyRevenue),
      accent: 'text-amber-600',
      bg: 'bg-amber-50',
      dot: 'bg-amber-600',
    },
  ];

  const maxStatusCount = Math.max(
    ...Object.values(stats.prospectsByStatus),
    1,
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Vue d&apos;ensemble de votre pipeline</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${card.accent}`}>
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center`}
              >
                <div className={`w-3 h-3 ${card.dot} rounded-full`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Conversion Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Taux de conversion
          </h2>
          <p className="text-slate-500 text-sm mb-3">
            De l&apos;envoi d&apos;email a la conversion en client
          </p>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-bold text-emerald-600">
              {formatPercent(stats.conversionRate)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(stats.conversionRate * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Email Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Statistiques emails
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Envoyes</span>
              <span className="text-sm font-semibold text-slate-900">
                {stats.emailStats.sent}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Taux d&apos;ouverture</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatPercent(stats.emailStats.openRate)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(stats.emailStats.openRate * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Taux de clic</span>
              <span className="text-sm font-semibold text-indigo-600">
                {formatPercent(stats.emailStats.clickRate)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(stats.emailStats.clickRate * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Rebonds</span>
              <span className="text-sm font-semibold text-red-500">
                {stats.emailStats.bounced}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prospects by Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Prospects par statut
        </h2>
        <div className="space-y-3">
          {Object.entries(stats.prospectsByStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-36 shrink-0">
                {STATUS_LABELS[status] || status}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-5 rounded-full ${STATUS_COLORS[status] || 'bg-slate-300'}`}
                  style={{
                    width: `${(count / maxStatusCount) * 100}%`,
                    minWidth: count > 0 ? '1rem' : '0',
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-10 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
