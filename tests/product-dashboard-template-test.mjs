import assert from "node:assert/strict";
import {
  PRODUCT_DASHBOARD_CLASSES,
  PRODUCT_DASHBOARD_SECTION_KINDS,
  PRODUCT_DASHBOARD_THEME,
  createDashboardChip,
  createMetricRow,
  createMissingInformationSection,
  createProductDashboard,
  createProductDashboardSection,
  createRecommendedBenefitCard,
  normalizeProductDashboardSection
} from "../docs/static-preview/quote-preview-live/forge-product-dashboard-template.js";

class TestElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.className = "";
    this.dataset = {};
    this.children = [];
    this.textContent = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

const documentRef = {
  createElement(tagName) {
    return new TestElement(tagName);
  }
};

assert.ok(Object.isFrozen(PRODUCT_DASHBOARD_CLASSES));
assert.ok(Object.isFrozen(PRODUCT_DASHBOARD_THEME));
assert.deepEqual(PRODUCT_DASHBOARD_THEME, {
  title: "#f4d85d",
  primaryValue: "#f5dc6c",
  secondaryValue: "#76c9ee",
  label: "rgba(226, 232, 240, .76)",
  positive: "#8bd6a4",
  muted: "rgba(148, 163, 184, .76)",
  line: "rgba(125, 211, 252, .14)",
  panel: "rgba(8, 20, 39, .72)",
  tile: "rgba(255, 255, 255, .035)"
});
assert.equal(PRODUCT_DASHBOARD_CLASSES.dashboard, "fq-benefit-dashboard-107z15p2");
assert.equal(PRODUCT_DASHBOARD_CLASSES.card, "fq-benefit-card-107z15p2");
assert.equal(PRODUCT_DASHBOARD_CLASSES.metricRow, "fq-benefit-row-107z15p2");
assert.ok(PRODUCT_DASHBOARD_SECTION_KINDS.includes("construction"));
assert.ok(PRODUCT_DASHBOARD_SECTION_KINDS.includes("future_scenario"));
assert.ok(PRODUCT_DASHBOARD_SECTION_KINDS.includes("missing_information"));

const futureSection = normalizeProductDashboardSection({
  key: "future",
  kind: "future_scenario",
  title: "Escenario futuro",
  items: [{ label: "Dato", value: "Valor" }]
});
assert.equal(futureSection.kind, "future_scenario");
assert.equal(futureSection.title, "Escenario futuro");
assert.equal(futureSection.items.length, 1);
assert.ok(Object.isFrozen(futureSection));
assert.ok(Object.isFrozen(futureSection.items));

const dashboard = createProductDashboard({ documentRef });
assert.equal(dashboard.className, PRODUCT_DASHBOARD_CLASSES.dashboard);
assert.equal(dashboard.dataset.forgeProductDashboard, "true");

const section = createProductDashboardSection({
  title: "Lo que aportas",
  key: "contribution",
  documentRef
});
assert.equal(section.dataset.forgeBenefitBlock, "contribution");
assert.equal(section.children[0].textContent, "Lo que aportas");

const row = createMetricRow({ label: "Métrica", value: "Valor", documentRef });
assert.equal(row.className, PRODUCT_DASHBOARD_CLASSES.metricRow);
assert.equal(row.children[0].textContent, "Métrica");
assert.equal(row.children[1].textContent, "Valor");

const chip = createDashboardChip({
  label: "Año 10",
  primary: "Valor principal",
  secondary: "Detalle",
  documentRef
});
assert.equal(chip.children.length, 3);
assert.equal(chip.children[1].textContent, "Valor principal");

const recommended = createRecommendedBenefitCard({
  name: "Beneficio",
  fields: [{ label: "Estado", value: "Disponible" }],
  documentRef
});
assert.equal(recommended.children[0].textContent, "Beneficio");
assert.equal(recommended.children[1].children.length, 1);

const missing = createMissingInformationSection({
  values: ["Dato pendiente"],
  documentRef
});
assert.equal(missing.dataset.forgeProductSection, "missing_information");
assert.equal(missing.children[1].children[0].textContent, "Dato pendiente");

assert.throws(
  () => createProductDashboard({ documentRef: {} }),
  /requires a document/
);

console.log("PASS reusable product dashboard template R13A");
