// Renders a list of checks ({ id, state, params }) into a <ul>.
// All text goes in with textContent; nothing from the user is ever parsed as HTML.
//
//   renderChecks(listEl, checks, {
//     messages:  { [id]: (params) => string },
//     labels:    { pass, warn, fail },   // read out by screen readers before each message
//     emptyText: "Type something to see checks."
//   })

export function renderChecks(listEl, checks, { messages, labels, emptyText }) {
  listEl.textContent = "";

  if (!checks.length) {
    const li = document.createElement("li");
    li.dataset.state = "info";
    li.textContent = emptyText;
    listEl.appendChild(li);
    return;
  }

  const stateLabel = { pass: labels.pass, warn: labels.warn, fail: labels.fail };
  for (const check of checks) {
    const li = document.createElement("li");
    li.dataset.state = check.state;

    const icon = document.createElement("span");
    icon.className = "check-icon";
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = `${stateLabel[check.state]}: `;

    const message = document.createElement("span");
    message.textContent = messages[check.id](check.params);

    li.append(icon, label, message);
    listEl.appendChild(li);
  }
}
