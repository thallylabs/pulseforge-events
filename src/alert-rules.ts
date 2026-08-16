/** In-memory alert routing registry with delivery history for test operations. */

import type {
  AlertDelivery,
  AlertRule,
  AlertRuleTestResult,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
} from "./types.js";

export interface AlertRuleRegistry {
  listAlertRules(): Array<AlertRule>;
  getAlertRule(id: string): AlertRule | undefined;
  createAlertRule(input: CreateAlertRuleInput): AlertRule;
  updateAlertRule(id: string, input: UpdateAlertRuleInput): AlertRule | undefined;
  deleteAlertRule(id: string): boolean;
  testAlertRule(id: string): AlertRuleTestResult | undefined;
  listAlertDeliveries(id: string): Array<AlertDelivery> | undefined;
}

function validateDestination(input: CreateAlertRuleInput["destination"]): void {
  if (input.kind === "email" && !input.target.includes("@")) {
    throw new Error("invalid_email_destination");
  }
  if (input.kind === "webhook") {
    const url = new URL(input.target);
    if (url.protocol !== "https:") throw new Error("webhook_requires_https");
  }
}

function validateCooldown(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 86_400) {
    throw new Error("invalid_cooldown_seconds");
  }
}

export function createAlertRuleRegistry(): AlertRuleRegistry {
  const rules = new Map<string, AlertRule>();
  const deliveries = new Map<string, Array<AlertDelivery>>();
  let ruleSequence = 0;
  let deliverySequence = 0;

  return {
    listAlertRules: () => [...rules.values()],
    getAlertRule: (id) => rules.get(id),
    createAlertRule(input) {
      validateDestination(input.destination);
      const cooldownSeconds = input.cooldownSeconds ?? 300;
      validateCooldown(cooldownSeconds);
      ruleSequence += 1;
      const now = new Date().toISOString();
      const rule: AlertRule = {
        id: `rule_${String(ruleSequence).padStart(6, "0")}`,
        name: input.name,
        eventTypes: input.eventTypes,
        destination: input.destination,
        cooldownSeconds,
        isEnabled: true,
        createdAt: now,
        updatedAt: now,
      };
      rules.set(rule.id, rule);
      deliveries.set(rule.id, []);
      return rule;
    },
    updateAlertRule(id, input) {
      const current = rules.get(id);
      if (!current) return undefined;
      if (input.destination) validateDestination(input.destination);
      if (input.cooldownSeconds !== undefined) validateCooldown(input.cooldownSeconds);
      const updated: AlertRule = {
        ...current,
        ...input,
        destination: input.destination ?? current.destination,
        eventTypes: input.eventTypes ?? current.eventTypes,
        updatedAt: new Date().toISOString(),
      };
      rules.set(id, updated);
      return updated;
    },
    deleteAlertRule(id) {
      deliveries.delete(id);
      return rules.delete(id);
    },
    testAlertRule(id) {
      const rule = rules.get(id);
      if (!rule) return undefined;
      deliverySequence += 1;
      const delivery: AlertDelivery = {
        id: `delivery_${String(deliverySequence).padStart(6, "0")}`,
        ruleId: id,
        eventType: rule.eventTypes[0] ?? "incident.opened",
        status: "delivered",
        attemptedAt: new Date().toISOString(),
      };
      deliveries.get(id)?.push(delivery);
      return { rule, delivery };
    },
    listAlertDeliveries(id) {
      return rules.has(id) ? [...(deliveries.get(id) ?? [])] : undefined;
    },
  };
}
