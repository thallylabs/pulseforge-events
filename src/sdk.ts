/** Typed browser client for the Pulseforge HTTP API. */

import type {
  CreateIncidentInput,
  CreateIncidentUpdateInput,
  Incident,
  StatusSummary,
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
  };
}
