"use client";

import { Badge } from "@/components/ui/badge";

export interface ServiceStatusBadgeProps {
  enabled: boolean;
  configured: boolean;
}

export function ServiceStatusBadge({ enabled, configured }: ServiceStatusBadgeProps) {
  if (enabled) {
    return <Badge variant="success">Enabled</Badge>;
  }
  
  if (configured) {
    return <Badge variant="warning">Partially Configured</Badge>;
  }
  
  return <Badge variant="error">Disabled</Badge>;
}
