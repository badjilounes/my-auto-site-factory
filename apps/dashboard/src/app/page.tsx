'use client';

import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface DashboardStats {
  totalProspects: number;
  sitesGenerated: number;
  sitesDeployed: number;
  pendingOutreach: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalProspects: 0,
    sitesGenerated: 0,
    sitesDeployed: 0,
    pendingOutreach: 0,
  });
  const [activities, setActivities] = React.useState<RecentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/stats`),
          fetch(`${API_URL}/api/dashboard/activity`),
        ]);
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (activitiesRes.ok) {
          setActivities(await activitiesRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Prospects',
      value: stats.totalProspects,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      label: 'Sites Generated',
      value: stats.sitesGenerated,
      color: 'bg-green-600',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
    },
    {
      label: 'Sites Deployed',
      value: stats.sitesDeployed,
      color: 'bg-purple-600',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      label: 'Pending Outreach',
      value: stats.pendingOutreach,
      color: 'bg-amber-600',
      textColor: 'text-amber-600',
      bgLight: 'bg-amber-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Overview of your auto site factory pipeline
        </p>
      </div>

      {/* Stats Cards */}
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
                <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${card.bgLight} rounded-lg flex items-center justify-center`}
              >
                <div className={`w-3 h-3 ${card.color} rounded-full`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-400">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activity.type === 'prospect_added'
                        ? 'bg-blue-100 text-blue-700'
                        : activity.type === 'site_generated'
                          ? 'bg-green-100 text-green-700'
                          : activity.type === 'site_deployed'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {activity.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-slate-700">
                    {activity.message}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
