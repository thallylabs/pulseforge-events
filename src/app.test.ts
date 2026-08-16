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
});
