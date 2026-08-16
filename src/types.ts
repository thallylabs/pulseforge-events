/** Public contracts shared by the HTTP handler and browser SDK. */

export interface Service {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage";
}

export interface IncidentUpdate {
  id: string;
  message: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "degraded" | "outage";
  status: "investigating" | "monitoring" | "resolved";
  serviceIds: Array<string>;
  updates: Array<IncidentUpdate>;
  createdAt: string;
  resolvedAt?: string;
}

export interface StatusSummary {
  status: Service["status"];
  services: Array<Service>;
  activeIncidents: Array<Incident>;
  generatedAt: string;
}

export interface CreateIncidentInput {
  title: string;
  severity: Incident["severity"];
  serviceIds: Array<string>;
}

export interface CreateIncidentUpdateInput {
  message: string;
  status?: "investigating" | "monitoring";
}

export type AlertEventType =
  | "incident.opened"
  | "incident.updated"
  | "incident.escalated"
  | "incident.resolved";

export interface AlertDestination {
  kind: "email" | "webhook";
  target: string;
}

export interface AlertRule {
  id: string;
  name: string;
  eventTypes: Array<AlertEventType>;
  destination: AlertDestination;
  isEnabled: boolean;
  cooldownSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRuleInput {
  name: string;
  eventTypes: Array<AlertEventType>;
  destination: AlertDestination;
  cooldownSeconds?: number;
}

export interface UpdateAlertRuleInput {
  name?: string;
  eventTypes?: Array<AlertEventType>;
  destination?: AlertDestination;
  isEnabled?: boolean;
  cooldownSeconds?: number;
}

export interface AlertDelivery {
  id: string;
  ruleId: string;
  eventType: AlertEventType;
  status: "delivered" | "failed";
  attemptedAt: string;
}

export interface AlertRuleTestResult {
  rule: AlertRule;
  delivery: AlertDelivery;
}
