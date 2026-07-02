import { genesisBetaLoopCards } from "./genesis-beta-loop-card-data.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function chip(text, className = "forge-chip") {
  return el("span", className, text);
}

function list(title, items) {
  const section = el("div", "genesis-card-section");
  section.appendChild(el("h4", "", title));
  const ul = el("ul", "genesis-card-list");
  (items || []).forEach((item) => ul.appendChild(el("li", "", item)));
  section.appendChild(ul);
  return section;
}

function renderCard(card) {
  const article = el("article", "mini-card glass genesis-beta-loop-card");
  article.setAttribute("data-scenario-id", card.scenarioId);

  const eyebrow = el("p", "eyebrow", "Genesis Beta Loop");
  const title = el("h3", "", card.title);
  const subtitle = el("p", "muted", card.subtitle);

  const chips = el("div", "genesis-card-chips");
  [
    "Human final authority",
    "Review only",
    "Not approved",
    "Not sendable",
    "Delivery locked",
    "Evidence visible",
    "Uncertainty visible"
  ].forEach((label) => chips.appendChild(chip(label)));

  const safety = el("p", "metric-line", `Safety: ${card.safetyBadge}`);
  const draft = el("p", "metric-line", `Draft: ${card.draftQualityBadge}`);
  const draftPreview = el("p", "genesis-draft-preview", card.candidateDraftPreview);

  const article0 = el(
    "p",
    "article-zero-reminder",
    "Article 0: strengthen human judgment, not replace it."
  );

  article.appendChild(eyebrow);
  article.appendChild(title);
  article.appendChild(subtitle);
  article.appendChild(chips);
  article.appendChild(safety);
  article.appendChild(draft);
  article.appendChild(el("h4", "", "Draft preview"));
  article.appendChild(draftPreview);
  article.appendChild(list("Evidence", card.evidenceRefs));
  article.appendChild(el("p", "muted", `Reasoning: ${card.reasoningSummary}`));
  article.appendChild(el("p", "muted", `Uncertainty: ${card.uncertaintySummary}`));
  article.appendChild(list("Human review questions", card.humanReviewQuestions));
  article.appendChild(list("Approval prerequisites", card.approvalPrerequisites));
  article.appendChild(el("p", "locked-line", `Blocked: ${card.blockedReason.join(", ")}`));
  article.appendChild(article0);

  return article;
}

function main() {
  const target = document.getElementById("genesis-cards");
  if (!target) return;
  target.innerHTML = "";
  genesisBetaLoopCards.forEach((card) => target.appendChild(renderCard(card)));
}

document.addEventListener("DOMContentLoaded", main);
