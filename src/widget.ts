/** Dependency-free custom element for embedding the current service status. */

import { createPulseforgeClient } from "./sdk.js";

export function registerPulseforgeStatusWidget(): void {
  if (typeof customElements === "undefined" || customElements.get("pulseforge-status")) return;

  customElements.define(
    "pulseforge-status",
    class extends HTMLElement {
      async connectedCallback() {
        const baseUrl = this.getAttribute("api-base") ?? window.location.origin;
        this.textContent = "Loading service status…";
        try {
          const summary = await createPulseforgeClient({ baseUrl }).getStatus();
          this.textContent = `${summary.status}: ${summary.activeIncidents.length} active incidents`;
        } catch {
          this.textContent = "Status unavailable";
        }
      }
    },
  );
}

registerPulseforgeStatusWidget();
