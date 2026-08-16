/** Fetch-compatible API surface for the Pulseforge reference server. */

import type { PulseforgeStore } from "./store.js";
import type { CreateIncidentInput, CreateIncidentUpdateInput } from "./types.js";

export interface PulseforgeAppOptions {
  store: PulseforgeStore;
  token: string;
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

function isAuthorized(request: Request, token: string): boolean {
  return request.headers.get("authorization") === `Bearer ${token}`;
}

export function createPulseforgeApp(options: PulseforgeAppOptions) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);

    if (request.method === "GET" && url.pathname === "/v1/status") {
      return json(options.store.getStatus());
    }
    if (!isAuthorized(request, options.token)) {
      return json({ error: "unauthorized" }, 401);
    }
    if (request.method === "POST" && url.pathname === "/v1/incidents") {
      const input = (await request.json()) as CreateIncidentInput;
      return json(options.store.createIncident(input), 201);
    }
    if (
      request.method === "POST" &&
      segments[0] === "v1" &&
      segments[1] === "incidents" &&
      segments[3] === "updates"
    ) {
      const input = (await request.json()) as CreateIncidentUpdateInput;
      const incident = options.store.addIncidentUpdate(segments[2] ?? "", input);
      return incident ? json(incident) : json({ error: "incident_not_found" }, 404);
    }
    if (
      request.method === "PATCH" &&
      segments[0] === "v1" &&
      segments[1] === "incidents" &&
      segments[3] === "resolve"
    ) {
      const incident = options.store.resolveIncident(segments[2] ?? "");
      return incident ? json(incident) : json({ error: "incident_not_found" }, 404);
    }
    return json({ error: "not_found" }, 404);
  };
}
