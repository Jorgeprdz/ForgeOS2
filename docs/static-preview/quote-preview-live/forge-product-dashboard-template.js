const PRODUCT_DASHBOARD_CLASSES = Object.freeze({
  dashboard: "fq-benefit-dashboard-107z15p2",
  card: "fq-benefit-card-107z15p2",
  cardTitle: "fq-benefit-card-title-107z15p2",
  metricRows: "fq-benefit-rows-107z15p2",
  metricRow: "fq-benefit-row-107z15p2",
  primaryMetricGrid: "fq-benefit-mini-grid-107z15p2",
  primaryMetric: "fq-benefit-mini-card-107z15p2",
  label: "fq-benefit-label-107z15p2",
  value: "fq-benefit-value-107z15p2",
  valuePart: "fq-benefit-value-part-107z15p2",
  chipGrid: "fq-benefit-dotal-chips-107z15p2",
  chip: "fq-benefit-dotal-chip-107z15p2",
  chipLabel: "fq-benefit-dotal-year-107z15p2",
  chipPrimary: "fq-benefit-dotal-udi-107z15p2",
  chipSecondary: "fq-benefit-dotal-mxn-107z15p2",
  recommendedGrid: "fq-benefit-recommended-grid-107z15p2",
  recommendedCard: "fq-benefit-recommended-card-107z15p2",
  recommendedName: "fq-benefit-recommended-name-107z15p2",
  recommendedFields: "fq-benefit-recommended-fields-107z15p2",
  recommendedField: "fq-benefit-recommended-field-107z15p2",
  missingList: "fq-benefit-missing-list-107z15p2"
});

const PRODUCT_DASHBOARD_THEME = Object.freeze({
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

const PRODUCT_DASHBOARD_SECTION_KINDS = Object.freeze([
  "summary",
  "contribution",
  "construction",
  "protection",
  "future_scenario",
  "recommended",
  "secondary_details",
  "missing_information"
]);

function requireDocument(documentRef) {
  const target = documentRef || globalThis.document;
  if (!target?.createElement) {
    throw new TypeError("Product dashboard rendering requires a document");
  }
  return target;
}

function appendContent(target, content) {
  if (typeof content === "function") {
    content(target);
    return;
  }
  if (content !== null && content !== undefined) {
    target.textContent = String(content);
  }
}

function normalizeProductDashboardSection(section = {}) {
  const key = String(section.key || section.kind || "secondary_details").trim() || "secondary_details";
  return Object.freeze({
    key,
    kind: String(section.kind || key).trim() || "secondary_details",
    title: String(section.title || "").trim(),
    presentation: String(section.presentation || "metric_rows").trim() || "metric_rows",
    items: Object.freeze(Array.isArray(section.items) ? [...section.items] : [])
  });
}

function createProductDashboard({ documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const dashboard = documentTarget.createElement("div");
  dashboard.className = PRODUCT_DASHBOARD_CLASSES.dashboard;
  dashboard.dataset.forgeProductDashboard = "true";
  return dashboard;
}

function createProductDashboardSection({ title, key, kind, documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const section = documentTarget.createElement("section");
  section.className = PRODUCT_DASHBOARD_CLASSES.card;
  section.dataset.forgeBenefitBlock = String(key || kind || "secondary_details");
  section.dataset.forgeProductSection = String(kind || key || "secondary_details");

  if (title) {
    const heading = documentTarget.createElement("h4");
    heading.className = PRODUCT_DASHBOARD_CLASSES.cardTitle;
    heading.textContent = String(title);
    section.appendChild(heading);
  }

  return section;
}

function createMetricRow({ label, value, appendValue, documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const row = documentTarget.createElement("div");
  row.className = PRODUCT_DASHBOARD_CLASSES.metricRow;

  const labelNode = documentTarget.createElement("div");
  labelNode.className = PRODUCT_DASHBOARD_CLASSES.label;
  labelNode.textContent = String(label || "");

  const valueNode = documentTarget.createElement("div");
  valueNode.className = PRODUCT_DASHBOARD_CLASSES.value;
  appendContent(valueNode, appendValue || value);

  row.append(labelNode, valueNode);
  return row;
}

function createPrimaryMetric({ label, value, appendValue, documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const metric = documentTarget.createElement("div");
  metric.className = PRODUCT_DASHBOARD_CLASSES.primaryMetric;

  const labelNode = documentTarget.createElement("div");
  labelNode.className = PRODUCT_DASHBOARD_CLASSES.label;
  labelNode.textContent = String(label || "");

  const valueNode = documentTarget.createElement("div");
  valueNode.className = PRODUCT_DASHBOARD_CLASSES.value;
  appendContent(valueNode, appendValue || value);

  metric.append(labelNode, valueNode);
  return metric;
}

function createDashboardChip({ label, primary, secondary, documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const chip = documentTarget.createElement("div");
  chip.className = PRODUCT_DASHBOARD_CLASSES.chip;

  const labelNode = documentTarget.createElement("span");
  labelNode.className = PRODUCT_DASHBOARD_CLASSES.chipLabel;
  labelNode.textContent = String(label || "");

  const primaryNode = documentTarget.createElement("strong");
  primaryNode.className = PRODUCT_DASHBOARD_CLASSES.chipPrimary;
  primaryNode.textContent = String(primary || "");

  chip.append(labelNode, primaryNode);

  if (secondary !== null && secondary !== undefined && String(secondary).trim()) {
    const secondaryNode = documentTarget.createElement("span");
    secondaryNode.className = PRODUCT_DASHBOARD_CLASSES.chipSecondary;
    secondaryNode.textContent = String(secondary);
    chip.appendChild(secondaryNode);
  }

  return chip;
}

function createRecommendedBenefitCard({ name, fields = [], appendValue, documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const card = documentTarget.createElement("article");
  card.className = PRODUCT_DASHBOARD_CLASSES.recommendedCard;

  const heading = documentTarget.createElement("h5");
  heading.className = PRODUCT_DASHBOARD_CLASSES.recommendedName;
  heading.textContent = String(name || "");

  const fieldGrid = documentTarget.createElement("div");
  fieldGrid.className = PRODUCT_DASHBOARD_CLASSES.recommendedFields;

  for (const field of fields) {
    const fieldNode = documentTarget.createElement("div");
    fieldNode.className = PRODUCT_DASHBOARD_CLASSES.recommendedField;

    const labelNode = documentTarget.createElement("div");
    labelNode.className = PRODUCT_DASHBOARD_CLASSES.label;
    labelNode.textContent = String(field?.label || "");

    const valueNode = documentTarget.createElement("div");
    valueNode.className = PRODUCT_DASHBOARD_CLASSES.value;
    appendContent(valueNode, appendValue ? (target) => appendValue(target, field?.value) : field?.value);

    fieldNode.append(labelNode, valueNode);
    fieldGrid.appendChild(fieldNode);
  }

  card.append(heading, fieldGrid);
  return card;
}

function createMissingInformationSection({ title = "Faltantes antes de presentar", values = [], key = "missing", documentRef } = {}) {
  const documentTarget = requireDocument(documentRef);
  const section = createProductDashboardSection({
    title,
    key,
    kind: "missing_information",
    documentRef: documentTarget
  });
  const list = documentTarget.createElement("ul");
  list.className = PRODUCT_DASHBOARD_CLASSES.missingList;

  for (const value of values) {
    const item = documentTarget.createElement("li");
    item.textContent = String(value);
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

const api = Object.freeze({
  classes: PRODUCT_DASHBOARD_CLASSES,
  theme: PRODUCT_DASHBOARD_THEME,
  sectionKinds: PRODUCT_DASHBOARD_SECTION_KINDS,
  normalizeProductDashboardSection,
  createProductDashboard,
  createProductDashboardSection,
  createMetricRow,
  createPrimaryMetric,
  createDashboardChip,
  createRecommendedBenefitCard,
  createMissingInformationSection
});

globalThis.ForgeProductDashboardTemplate = api;

export {
  PRODUCT_DASHBOARD_CLASSES,
  PRODUCT_DASHBOARD_THEME,
  PRODUCT_DASHBOARD_SECTION_KINDS,
  normalizeProductDashboardSection,
  createProductDashboard,
  createProductDashboardSection,
  createMetricRow,
  createPrimaryMetric,
  createDashboardChip,
  createRecommendedBenefitCard,
  createMissingInformationSection
};
