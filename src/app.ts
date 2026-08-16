/** Fetch-compatible API surface for the Pulseforge reference server. */

import type { PulseforgeStore } from "./store.js";
import type {
  CreateAlertRuleInput,
  CreateIncidentInput,
  CreateIncidentUpdateInput,
  UpdateAlertRuleInput,
} from "./types.js";

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
    if (url.pathname === "/v1/alert-rules" && request.method === "GET") {
      return json({ rules: options.store.listAlertRules() });
    }
    if (url.pathname === "/v1/alert-rules" && request.method === "POST") {
      try {
        const input = (await request.json()) as CreateAlertRuleInput;
        return json(options.store.createAlertRule(input), 201);
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "invalid_alert_rule" },
          400,
        );
      }
    }
    if (
      segments[0] === "v1" &&
      segments[1] === "alert-rules" &&
      segments[3] === "test" &&
      request.method === "POST"
    ) {
      const result = options.store.testAlertRule(segments[2] ?? "");
      return result ? json(result, 202) : json({ error: "alert_rule_not_found" }, 404);
    }
    if (
      segments[0] === "v1" &&
      segments[1] === "alert-rules" &&
      segments[3] === "deliveries" &&
      request.method === "GET"
    ) {
      const deliveries = options.store.listAlertDeliveries(segments[2] ?? "");
      return deliveries ? json({ deliveries }) : json({ error: "alert_rule_not_found" }, 404);
    }
    if (
      segments.length === 3 &&
      segments[0] === "v1" &&
      segments[1] === "alert-rules" &&
      request.method === "GET"
    ) {
      const rule = options.store.getAlertRule(segments[2] ?? "");
      return rule ? json(rule) : json({ error: "alert_rule_not_found" }, 404);
    }
    if (
      segments.length === 3 &&
      segments[0] === "v1" &&
      segments[1] === "alert-rules" &&
      request.method === "PATCH"
    ) {
      try {
        const input = (await request.json()) as UpdateAlertRuleInput;
        const rule = options.store.updateAlertRule(segments[2] ?? "", input);
        return rule ? json(rule) : json({ error: "alert_rule_not_found" }, 404);
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "invalid_alert_rule" },
          400,
        );
      }
    }
    if (
      segments.length === 3 &&
      segments[0] === "v1" &&
      segments[1] === "alert-rules" &&
      request.method === "DELETE"
    ) {
      return options.store.deleteAlertRule(segments[2] ?? "")
        ? new Response(null, { status: 204 })
        : json({ error: "alert_rule_not_found" }, 404);
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
