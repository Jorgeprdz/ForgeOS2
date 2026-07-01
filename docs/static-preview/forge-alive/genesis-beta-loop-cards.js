const cards = [
  {
    title: "Jorge / Maria follow-up review",
    subtitle: "relationship follow-up context, not send approval",
    draft: "Hola Maria, espero que estes muy bien. Queria retomar nuestra conversacion con calma y saber si te gustaria que lo revisemos juntos esta semana.",
    evidence: ["previous conversation", "15-day follow-up", "pending follow-up"],
    note: "Delivery locked until real human approval."
  },
  {
    title: "Andres / Juan bonus proximity review",
    subtitle: "motivational context / candidate estimate, not payout truth",
    draft: "Juan, vi que hay una oportunidad que podria valer la pena revisar con calma. Si te hace sentido, podemos ver juntos que falta y decidir el siguiente paso.",
    evidence: ["bonus proximity", "Juan relative signal", "consultative message"],
    note: "Bonus context is not payout truth."
  },
  {
    title: "Lupita / Maria car goal review",
    subtitle: "motivation context, not compensation truth",
    draft: "Maria, me acorde de la meta del coche y pense que puede servir como referencia para ordenar el siguiente paso. Si quieres, lo revisamos con calma.",
    evidence: ["car goal", "Maria advancement signal", "consistency signal"],
    note: "Goal context is not compensation truth."
  }
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderCard(card) {
  const article = el("article", "mini-card glass genesis-beta-loop-card");

  article.appendChild(el("p", "eyebrow", "Genesis Beta Loop"));
  article.appendChild(el("h3", "", card.title));
  article.appendChild(el("p", "muted", card.subtitle));

  const chips = el("div", "genesis-card-chips");
  [
    "Human final authority",
    "Review only",
    "Not approved",
    "Not sendable",
    "Delivery locked",
    "Evidence visible",
    "Uncertainty visible"
  ].forEach((label) => chips.appendChild(el("span", "forge-chip", label)));
  article.appendChild(chips);

  article.appendChild(el("h4", "", "Draft preview"));
  article.appendChild(el("p", "genesis-draft-preview", card.draft));

  article.appendChild(el("h4", "", "Evidence"));
  const evidence = el("ul", "genesis-card-list");
  card.evidence.forEach((item) => evidence.appendChild(el("li", "", item)));
  article.appendChild(evidence);

  article.appendChild(el("p", "muted", card.note));
  article.appendChild(el("p", "article-zero-reminder", "Article 0: strengthen human judgment, not replace it."));

  return article;
}

function main() {
  const target = document.getElementById("genesis-cards");
  if (!target) return;
  target.innerHTML = "";
  cards.forEach((card) => target.appendChild(renderCard(card)));
}

document.addEventListener("DOMContentLoaded", main);
