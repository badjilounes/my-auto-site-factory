'use client';

import * as React from 'react';
import { Badge } from './badge';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  NEW: { label: 'Nouveau', variant: 'secondary' },
  ENRICHED: { label: 'Enrichi', variant: 'default' },
  SITE_GENERATING: { label: 'Generation...', variant: 'warning' },
  SITE_GENERATED: { label: 'Site genere', variant: 'default' },
  SITE_DEPLOYED: { label: 'Deploye', variant: 'success' },
  OUTREACH_SENT: { label: 'Email envoye', variant: 'warning' },
  INTERESTED: { label: 'Interesse', variant: 'success' },
  CLIENT: { label: 'Client', variant: 'success' },
  REJECTED: { label: 'Refuse', variant: 'destructive' },
  PENDING: { label: 'En attente', variant: 'secondary' },
  BUILDING: { label: 'Construction', variant: 'warning' },
  DEPLOYED: { label: 'Deploye', variant: 'success' },
  FAILED: { label: 'Echec', variant: 'destructive' },
  TRIAL: { label: 'Essai', variant: 'warning' },
  ACTIVE: { label: 'Actif', variant: 'success' },
  CANCELLED: { label: 'Annule', variant: 'destructive' },
  EXPIRED: { label: 'Expire', variant: 'destructive' },
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  SENT: { label: 'Envoye', variant: 'default' },
  PAID: { label: 'Paye', variant: 'success' },
  OVERDUE: { label: 'En retard', variant: 'destructive' },
  RUNNING: { label: 'En cours', variant: 'warning' },
  COMPLETED: { label: 'Termine', variant: 'success' },
  QUEUED: { label: 'File attente', variant: 'secondary' },
  OPENED: { label: 'Ouvert', variant: 'success' },
  CLICKED: { label: 'Clique', variant: 'success' },
  BOUNCED: { label: 'Rejete', variant: 'destructive' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
