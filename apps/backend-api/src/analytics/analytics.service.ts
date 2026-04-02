import { Injectable } from '@nestjs/common';
import {
  prisma,
  prospectRepository,
} from '@my-auto-site-factory/core-database';

@Injectable()
export class AnalyticsService {
  async getDashboardStats() {
    const [
      prospectsByStatus,
      totalProspects,
      totalSitesDeployed,
      totalClients,
      monthlyRevenue,
      emailStats,
    ] = await Promise.all([
      prospectRepository.countByStatus(),
      prospectRepository.count(),
      prisma.generatedSite.count({ where: { deploymentStatus: 'DEPLOYED' } }),
      prisma.clientAccount.count(),
      this.getMonthlyRevenue(),
      this.getEmailStats(),
    ]);

    const outreachSent = (prospectsByStatus['OUTREACH_SENT'] ?? 0)
      + (prospectsByStatus['INTERESTED'] ?? 0)
      + (prospectsByStatus['CLIENT'] ?? 0);
    const clientCount = prospectsByStatus['CLIENT'] ?? 0;
    const conversionRate = outreachSent > 0
      ? Math.round((clientCount / outreachSent) * 10000) / 100
      : 0;

    return {
      prospectsByStatus,
      totalProspects,
      totalSitesDeployed,
      totalClients,
      monthlyRevenue,
      conversionRate,
      emailStats,
    };
  }

  private async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: firstOfMonth },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  private async getEmailStats() {
    const results = await prisma.outreachEmail.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats: Record<string, number> = {};
    for (const r of results) {
      stats[r.status] = r._count;
    }

    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    const sent = (stats['SENT'] ?? 0) + (stats['DELIVERED'] ?? 0)
      + (stats['OPENED'] ?? 0) + (stats['CLICKED'] ?? 0);
    const opened = (stats['OPENED'] ?? 0) + (stats['CLICKED'] ?? 0);
    const clicked = stats['CLICKED'] ?? 0;
    const bounced = stats['BOUNCED'] ?? 0;

    return {
      total,
      sent,
      opened,
      clicked,
      bounced,
      openRate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 10000) / 100 : 0,
    };
  }
}
