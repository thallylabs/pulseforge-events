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
