import { describe, expect, it } from "vitest";

import { createPulseforgeApp } from "./app.js";
import { createPulseforgeStore } from "./store.js";

describe("Pulseforge API", () => {
  it("publishes an incident through the public status response", async () => {
    const app = createPulseforgeApp({ store: createPulseforgeStore(), token: "test-token" });
    const created = await app(
      new Request("https://pulseforge.test/v1/incidents", {
        method: "POST",
        headers: { authorization: "Bearer test-token", "content-type": "application/json" },
        body: JSON.stringify({
          title: "Delivery latency",
          severity: "degraded",
          serviceIds: ["events-api"],
        }),
      }),
    );
    expect(created.status).toBe(201);

    const status = await app(new Request("https://pulseforge.test/v1/status"));
    const body = await status.json();
    expect(body.status).toBe("degraded");
    expect(body.activeIncidents).toHaveLength(1);
  });

  it("manages an alert rule through its complete API lifecycle", async () => {
    const app = createPulseforgeApp({ store: createPulseforgeStore(), token: "test-token" });
    const authorized = (path: string, init: RequestInit = {}) =>
      app(
        new Request(`https://pulseforge.test${path}`, {
          ...init,
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
            ...init.headers,
          },
        }),
      );

    const createdResponse = await authorized("/v1/alert-rules", {
      method: "POST",
      body: JSON.stringify({
        name: "Page on-call",
        eventTypes: ["incident.opened", "incident.escalated"],
        destination: { kind: "webhook", target: "https://alerts.example.com/hooks" },
        cooldownSeconds: 120,
      }),
    });
    expect(createdResponse.status).toBe(201);
    const created = await createdResponse.json();

    const listed = await (await authorized("/v1/alert-rules")).json();
    expect(listed.rules).toHaveLength(1);
    expect((await authorized(`/v1/alert-rules/${created.id}`)).status).toBe(200);

    const updated = await authorized(`/v1/alert-rules/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isEnabled: false, cooldownSeconds: 600 }),
    });
    expect((await updated.json()).isEnabled).toBe(false);

    const tested = await authorized(`/v1/alert-rules/${created.id}/test`, {
      method: "POST",
    });
    expect(tested.status).toBe(202);

    const deliveries = await (
      await authorized(`/v1/alert-rules/${created.id}/deliveries`)
    ).json();
    expect(deliveries.deliveries).toHaveLength(1);

    const deleted = await authorized(`/v1/alert-rules/${created.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);
    expect((await authorized(`/v1/alert-rules/${created.id}`)).status).toBe(404);
  });
});
