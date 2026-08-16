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
