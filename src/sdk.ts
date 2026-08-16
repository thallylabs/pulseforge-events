/** Typed browser client for the Pulseforge HTTP API. */

import type {
  AlertDelivery,
  AlertRule,
  AlertRuleTestResult,
  CreateAlertRuleInput,
  CreateIncidentInput,
  CreateIncidentUpdateInput,
  Incident,
  StatusSummary,
  UpdateAlertRuleInput,
} from "./types.js";

export interface PulseforgeClientOptions {
  baseUrl: string;
  token?: string;
}

export function createPulseforgeClient(options: PulseforgeClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(new URL(path, options.baseUrl), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) throw new Error(`Pulseforge request failed (${response.status})`);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    getStatus: () => request<StatusSummary>("/v1/status"),
    createIncident: (input: CreateIncidentInput) =>
      request<Incident>("/v1/incidents", { method: "POST", body: JSON.stringify(input) }),
    addIncidentUpdate: (id: string, input: CreateIncidentUpdateInput) =>
      request<Incident>(`/v1/incidents/${id}/updates`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    resolveIncident: (id: string) =>
      request<Incident>(`/v1/incidents/${id}/resolve`, { method: "PATCH" }),
    listAlertRules: async () =>
      (await request<{ rules: Array<AlertRule> }>("/v1/alert-rules")).rules,
    getAlertRule: (id: string) => request<AlertRule>(`/v1/alert-rules/${id}`),
    createAlertRule: (input: CreateAlertRuleInput) =>
      request<AlertRule>("/v1/alert-rules", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateAlertRule: (id: string, input: UpdateAlertRuleInput) =>
      request<AlertRule>(`/v1/alert-rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    deleteAlertRule: (id: string) =>
      request<void>(`/v1/alert-rules/${id}`, { method: "DELETE" }),
    testAlertRule: (id: string) =>
      request<AlertRuleTestResult>(`/v1/alert-rules/${id}/test`, { method: "POST" }),
    listAlertDeliveries: async (id: string) =>
      (
        await request<{ deliveries: Array<AlertDelivery> }>(
          `/v1/alert-rules/${id}/deliveries`,
        )
      ).deliveries,
  };
}

export type PulseforgeClient = ReturnType<typeof createPulseforgeClient>;
