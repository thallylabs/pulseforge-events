/** Operator-only custom element for reviewing and testing Pulseforge alert rules. */

import type { PulseforgeClient } from "./sdk.js";

export interface PulseforgeAlertCenterElement extends HTMLElement {
  client?: PulseforgeClient;
  refresh(): Promise<void>;
}

export function registerPulseforgeAlertCenterWidget(): void {
  if (typeof customElements === "undefined" || customElements.get("pulseforge-alert-center")) {
    return;
  }

  customElements.define(
    "pulseforge-alert-center",
    class extends HTMLElement implements PulseforgeAlertCenterElement {
      client?: PulseforgeClient;

      async connectedCallback() {
        await this.refresh();
      }

      async refresh() {
        if (!this.client) {
          this.textContent = "Assign an authenticated Pulseforge client to load alert rules.";
          return;
        }
        this.textContent = "Loading alert rules…";
        try {
          const rules = await this.client.listAlertRules();
          this.textContent = rules.length
            ? `${rules.length} alert rule${rules.length === 1 ? "" : "s"} configured`
            : "No alert rules configured";
        } catch {
          this.textContent = "Alert rules unavailable";
        }
      }
    },
  );
}

registerPulseforgeAlertCenterWidget();
