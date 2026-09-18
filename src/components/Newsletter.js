// Newsletter form handling.
//
// IMPORTANT: No email provider is connected yet. This module performs real
// client-side validation but does NOT claim a successful subscription, because
// there is nothing on the backend to subscribe anyone to. Once a provider
// (Mailchimp, Brevo, ConvertKit, Buttondown, etc.) is wired up, replace the
// body of `handleSubmit` with a real fetch() call to that provider's API and
// update the success branch below. See README.md → "Newsletter Integration".

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setStatus(form, message, state) {
  let status = form.parentElement.querySelector(".form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    form.insertAdjacentElement("afterend", status);
  }
  status.textContent = message;
  status.dataset.state = state;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector('input[type="email"]');
  const email = (input.value || "").trim();

  if (!email || !EMAIL_RE.test(email)) {
    setStatus(form, "Please enter a valid email address.", "error");
    input.focus();
    return;
  }

  const endpoint = form.dataset.endpoint;
  if (!endpoint) {
    // Honest placeholder state — no provider connected yet.
    setStatus(
      form,
      "Thanks for the interest — sign-ups aren't connected to an email provider yet. Check back soon.",
      "pending"
    );
    return;
  }

  // Real integration path once an endpoint is configured (see README).
  form.querySelector("button").disabled = true;
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then((res) => {
      if (!res.ok) throw new Error("Request failed");
      setStatus(form, "You're subscribed — thanks for joining.", "success");
      form.reset();
    })
    .catch(() => {
      setStatus(form, "Something went wrong. Please try again in a moment.", "error");
    })
    .finally(() => {
      form.querySelector("button").disabled = false;
    });
}

export function initNewsletterForms() {
  document.querySelectorAll(".newsletter-form").forEach((form) => {
    form.addEventListener("submit", handleSubmit);
  });
}
