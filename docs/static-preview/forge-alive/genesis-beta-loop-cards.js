const cards = [
  {
    title: "Jorge / Maria",
    context: "Follow-up 15 dias",
    subtitle: "relationship follow-up context, not send approval",
    draft: "Retomar la conversacion con calma y revisar si hace sentido avanzar.",
    evidence: ["previous conversation", "15-day follow-up", "pending follow-up"],
    boundary: "Delivery locked"
  },
  {
    title: "Andres / Juan",
    context: "Bonus proximity",
    subtitle: "motivational context / candidate estimate, not payout truth",
    draft: "Revisar la oportunidad como contexto, sin prometer pago ni resultado.",
    evidence: ["bonus proximity", "relative signal", "consultative message"],
    boundary: "Not payout truth"
  },
  {
    title: "Lupita / Maria",
    context: "Car goal",
    subtitle: "motivation context, not compensation truth",
    draft: "Usar la meta como referencia motivacional, sin convertirla en presion.",
    evidence: ["car goal", "advancement signal", "consistency signal"],
    boundary: "Not compensation truth"
  }
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function labelRow(label, value) {
  const row = el("div", "genesis-label-row");
  row.appendChild(el("span", "genesis-label-key", label));
  row.appendChild(el("span", "genesis-label-value", value));
  return row;
}

function renderCard(card) {
  const article = el("article", "mini-card glass genesis-beta-loop-card compact");

  article.appendChild(el("p", "eyebrow", "Genesis Beta Loop"));
  article.appendChild(el("h3", "", card.title));
  article.appendChild(el("p", "muted", card.context));
  article.appendChild(el("p", "genesis-subtitle", card.subtitle));

  const labels = el("div", "genesis-label-stack");
  labels.appendChild(labelRow("Authority", "Human final authority"));
  labels.appendChild(labelRow("Boundary", "Review only"));
  labels.appendChild(labelRow("Approval", "Not approved"));
  labels.appendChild(labelRow("Send", "Not sendable"));
  labels.appendChild(labelRow("Lock", card.boundary));
  article.appendChild(labels);

  article.appendChild(el("p", "genesis-draft-preview compact", card.draft));

  const evidence = el("div", "genesis-evidence-row");
  card.evidence.forEach((item) => evidence.appendChild(el("span", "forge-chip soft", item)));
  article.appendChild(evidence);

  article.appendChild(el("p", "article-zero-reminder compact", "Article 0: strengthen judgment, not replace it."));

  return article;
}

function main() {
  const target = document.getElementById("genesis-cards");
  if (!target) return;
  target.innerHTML = "";
  cards.forEach((card) => target.appendChild(renderCard(card)));
}

document.addEventListener("DOMContentLoaded", main);
