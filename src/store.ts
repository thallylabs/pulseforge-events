/** In-memory reference store; production adapters can provide durable storage. */

import type {
  CreateIncidentInput,
  CreateIncidentUpdateInput,
  Incident,
  Service,
  StatusSummary,
} from "./types.js";
import { createAlertRuleRegistry, type AlertRuleRegistry } from "./alert-rules.js";

export interface PulseforgeStore extends AlertRuleRegistry {
  getStatus(): StatusSummary;
  createIncident(input: CreateIncidentInput): Incident;
  addIncidentUpdate(id: string, input: CreateIncidentUpdateInput): Incident | undefined;
  resolveIncident(id: string): Incident | undefined;
}

export function createPulseforgeStore(
  services: Array<Service> = [{ id: "events-api", name: "Events API", status: "operational" }],
): PulseforgeStore {
  const incidents = new Map<string, Incident>();
  const alertRules = createAlertRuleRegistry();
  let sequence = 0;

  return {
    ...alertRules,
    getStatus() {
      const activeIncidents = [...incidents.values()].filter(
        (incident) => incident.status !== "resolved",
      );
      const status = activeIncidents.some((incident) => incident.severity === "outage")
        ? "outage"
        : activeIncidents.length > 0
          ? "degraded"
          : "operational";
      return { status, services, activeIncidents, generatedAt: new Date().toISOString() };
    },
    createIncident(input) {
      sequence += 1;
      const incident: Incident = {
        id: `inc_${String(sequence).padStart(6, "0")}`,
        title: input.title,
        severity: input.severity,
        status: "investigating",
        serviceIds: input.serviceIds,
        updates: [],
        createdAt: new Date().toISOString(),
      };
      incidents.set(incident.id, incident);
      return incident;
    },
    addIncidentUpdate(id, input) {
      const incident = incidents.get(id);
      if (!incident || incident.status === "resolved") return undefined;
      incident.updates.push({
        id: `upd_${String(incident.updates.length + 1).padStart(6, "0")}`,
        message: input.message,
        createdAt: new Date().toISOString(),
      });
      if (input.status) incident.status = input.status;
      return incident;
    },
    resolveIncident(id) {
      const incident = incidents.get(id);
      if (!incident) return undefined;
      incident.status = "resolved";
      incident.resolvedAt = new Date().toISOString();
      return incident;
    },
  };
}
