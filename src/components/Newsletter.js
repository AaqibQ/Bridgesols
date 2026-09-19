// Newsletter sign-up handling.
//
// Sign-ups are delivered to the site owner's inbox through Web3Forms (see
// src/config.js), which is how subscribers are collected for now. There is no
// automated mailing-list platform behind this yet; when one is added, swap the
// fetch() below for that provider's API.

import { WEB3FORMS_ACCESS_KEY, WEB3FORMS_URL } from "../config.js";

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
  const button = form.querySelector("button");
  const email = (input.value || "").trim();

  if (!email || !EMAIL_RE.test(email)) {
    setStatus(form, "Please enter a valid email address.", "error");
    input.focus();
    return;
  }

  button.disabled = true;
  setStatus(form, "Subscribing…", "pending");

  fetch(WEB3FORMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      from_name: "BridgeSols Newsletter",
      subject: "New BridgeSols newsletter subscriber",
      email,
      message: `New newsletter sign-up: ${email} (from ${location.pathname})`,
      botcheck: false
    })
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok && data.success })))
    .then(({ ok }) => {
      if (!ok) throw new Error("Request failed");
      setStatus(form, "Thanks — you're on the list.", "success");
      form.reset();
    })
    .catch(() => {
      setStatus(form, "Something went wrong. Please try again in a moment.", "error");
    })
    .finally(() => {
      button.disabled = false;
    });
}

export function initNewsletterForms() {
  document.querySelectorAll(".newsletter-form").forEach((form) => {
    form.addEventListener("submit", handleSubmit);
  });
}
