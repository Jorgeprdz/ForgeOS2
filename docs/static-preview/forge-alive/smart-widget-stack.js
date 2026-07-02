import { forgeAliveSmartWidgetStackPreview } from "./smart-widget-stack-data.js?v=053E";

const params = new URLSearchParams(window.location.search);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function familyLabel(value) {
  return String(value || "")
    .replace(/_WIDGET_FAMILY$/, "")
    .replace(/_WIDGET$/, "")
    .replace(/_/g, " ")
    .toLowerCase();
}

function pickContext() {
  const requested = params.get("context");
  const contexts = forgeAliveSmartWidgetStackPreview.contexts;
  if (requested) {
    const match = contexts.find((context) => context.id === requested);
    if (match) return match;
  }

  const hour = new Date().getHours();
  if (hour >= 15) return contexts.find((context) => context.id === "four-pm-review");
  if (hour >= 7 && hour <= 10) return contexts.find((context) => context.id === "morning-agenda");
  return contexts.find((context) => context.id === "follow-up-risk") || contexts[0];
}

function renderChip(text, tone) {
  const chip = el("span", `smart-widget-chip ${tone || ""}`.trim(), text);
  chip.setAttribute("aria-label", text);
  return chip;
}

function renderContextNav(activeContext) {
  const nav = el("nav", "smart-widget-contexts");
  nav.setAttribute("aria-label", "Smart widget preview contexts");

  for (const context of forgeAliveSmartWidgetStackPreview.contexts) {
    const item = el("a", context.id === activeContext.id ? "active" : "", context.label);
    item.href = `?context=${encodeURIComponent(context.id)}`;
    item.setAttribute("aria-label", `Preview context ${context.label}`);
    nav.appendChild(item);
  }

  return nav;
}

function renderEvidence(items) {
  const wrap = el("div", "smart-widget-evidence");
  wrap.appendChild(el("span", "smart-widget-mini-label", "Evidence"));
  wrap.appendChild(el("p", "", (items || []).join(" · ")));
  return wrap;
}

function renderWidget(widget, index) {
  const card = el("article", "smart-widget-card glass");

  const top = el("div", "smart-widget-card-top");
  const titleBlock = el("div", "smart-widget-title-block");
  titleBlock.appendChild(el("p", "smart-widget-eyebrow", familyLabel(widget.family)));
  titleBlock.appendChild(el("h3", "", widget.title));
  titleBlock.appendChild(el("p", "smart-widget-subtitle", widget.subtitle));
  top.appendChild(titleBlock);

  const priority = el("div", "smart-widget-priority");
  priority.appendChild(el("span", "", String(widget.priority)));
  priority.appendChild(el("small", "", index === 0 ? "TOP" : "CTX"));
  top.appendChild(priority);
  card.appendChild(top);

  const chips = el("div", "smart-widget-chips");
  chips.appendChild(renderChip("Human final authority", "gold"));
  chips.appendChild(renderChip("Review only", ""));
  chips.appendChild(renderChip("Not approved", ""));
  chips.appendChild(renderChip("Not sendable", ""));
  chips.appendChild(renderChip("Delivery locked", ""));
  card.appendChild(chips);

  card.appendChild(el("p", "smart-widget-why", `Why now: ${widget.whyNow}`));
  card.appendChild(renderEvidence(widget.evidence));
  card.appendChild(el("p", "smart-widget-uncertainty", `Uncertainty: ${widget.uncertainty}`));
  card.appendChild(el("p", "article-zero-reminder compact", forgeAliveSmartWidgetStackPreview.article0));
  card.appendChild(el("p", "smart-widget-prompt", widget.prompt));

  return card;
}

function main() {
  const target = document.getElementById("smart-widget-stack");
  if (!target) return;

  const context = pickContext();
  target.innerHTML = "";

  const header = el("header", "smart-widget-header glass");
  header.appendChild(el("p", "smart-widget-eyebrow", forgeAliveSmartWidgetStackPreview.version));
  header.appendChild(el("h2", "", "Smart Widget Stack"));
  header.appendChild(el("p", "smart-widget-subtitle", context.selectedWhen));
  header.appendChild(renderContextNav(context));
  target.appendChild(header);

  const grid = el("section", "smart-widget-grid");
  context.widgets
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .forEach((widget, index) => grid.appendChild(renderWidget(widget, index)));
  target.appendChild(grid);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
