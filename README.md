# Pulseforge Events

Pulseforge Events is a small incident-communication product used to publish a
service status API, manage incident timelines, and embed current status on a
customer-facing page.

## Install

```bash
npm install @pulseforge/events
```

## API

The reference handler supports:

- `GET /v1/status` for the public service summary.
- `POST /v1/incidents` to open an incident.
- `POST /v1/incidents/:id/updates` to append a timeline update.
- `PATCH /v1/incidents/:id/resolve` to resolve an incident.

Mutating requests require `Authorization: Bearer <token>`. The public status
endpoint never requires authentication.

## Browser SDK

```ts
import { createPulseforgeClient } from "@pulseforge/events/sdk";

const pulseforge = createPulseforgeClient({
  baseUrl: "https://status.example.com",
  token: process.env.PULSEFORGE_TOKEN,
});

await pulseforge.createIncident({
  title: "Elevated delivery latency",
  severity: "degraded",
  serviceIds: ["events-api"],
});
```

## Status widget

```html
<script type="module" src="https://cdn.example.com/pulseforge-widget.js"></script>
<pulseforge-status api-base="https://status.example.com"></pulseforge-status>
```

The widget reads only the public status endpoint and displays the current
overall state plus any active incidents.

## Alert rules

Version 1.1 adds reusable routing rules for incident events. A rule selects
event types, an email or webhook destination, and a delivery cooldown.

```ts
const rule = await pulseforge.createAlertRule({
  name: "Page the on-call webhook",
  eventTypes: ["incident.opened", "incident.escalated"],
  destination: {
    kind: "webhook",
    target: "https://alerts.example.com/pulseforge",
  },
  cooldownSeconds: 300,
});

await pulseforge.testAlertRule(rule.id);
```

The API supports create, list, read, update, delete, test, and delivery-history
operations under `/v1/alert-rules`. Alert-rule endpoints require the same
bearer token as incident mutations.

### Alert center widget

`<pulseforge-alert-center>` is an operator surface. Assign an authenticated SDK
client through its JavaScript `client` property; the element deliberately has
no token attribute so credentials never appear in markup.
