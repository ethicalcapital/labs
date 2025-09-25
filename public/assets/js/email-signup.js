(function () {
  const SELECTOR = "[data-email-signup]";

  function serializeFormData(form) {
    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        params.append(key, value.trim());
      }
    }
    return params;
  }

  function ensureHiddenInput(form, name, value) {
    if (!value) return;
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  async function submitWithFetch(action, params) {
    const response = await fetch(action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      mode: "cors",
    });
    return response;
  }

  function setup(container) {
    const form = container.querySelector("form");
    if (!form) return;

    const emailInput = form.querySelector("input[type='email']");
    if (!emailInput) return;

    const submitButton = form.querySelector("[type='submit']");
    const statusEl = container.querySelector("[data-signup-status]");
    const successMessage =
      container.dataset.signupSuccess ||
      "Thanks for subscribing! Check your inbox to confirm.";
    const errorMessage =
      container.dataset.signupError ||
      "Something went wrong. Please try again or email hello@ethicic.com.";
    const pendingMessage = container.dataset.signupPending || "Sending...";

    const listId = container.dataset.signupList || "ethicic";
    const tags = container.dataset.signupTags || "labs";
    const source = container.dataset.signupSource || window.location.pathname;

    const actionUrl = `https://buttondown.email/api/emails/embed-subscribe/${listId}`;
    form.setAttribute("action", actionUrl);
    form.setAttribute("method", "post");
    form.setAttribute("target", "popupwindow");

    ensureHiddenInput(form, "tag", tags);
    ensureHiddenInput(form, "referrer", source);
    ensureHiddenInput(form, "embed", "1");

    if (statusEl) {
      statusEl.setAttribute("aria-live", "polite");
      statusEl.classList.add("hidden");
    }

    let isSubmitting = false;

    function renderStatus(kind, message) {
      if (!statusEl) return;
      const baseClasses = ["alert", "shadow-sm", "rounded-xl", "py-2", "px-3"];
      statusEl.classList.remove(
        "hidden",
        "alert-info",
        "alert-success",
        "alert-error",
        "text-error",
        "text-success",
      );
      statusEl.classList.add(...baseClasses);
      if (!message) {
        statusEl.classList.add("hidden");
        statusEl.innerHTML = "";
        return;
      }
      const variantClass =
        kind === "success"
          ? "alert-success"
          : kind === "error"
            ? "alert-error"
            : "alert-info";
      statusEl.classList.add(variantClass);
      statusEl.innerHTML = `<span>${message}</span>`;
    }

    function logSignup(event) {
      try {
        const payload = JSON.stringify(event);
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          const sent = navigator.sendBeacon("/api/signup", blob);
          if (sent) return;
        }
        fetch("/api/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      } catch (error) {
        console.debug("signup telemetry skipped", error);
      }
    }

    async function handleSubmit(event) {
      if (isSubmitting) return;
      event.preventDefault();

      const email = emailInput.value.trim();
      if (!email) {
        emailInput.focus();
        return;
      }

      isSubmitting = true;
      form.classList.add("signup-panel__form--pending");
      if (submitButton) {
        submitButton.disabled = true;
      }
      renderStatus("pending", pendingMessage);

      const params = serializeFormData(form);
      params.set("email", email);

      try {
        const response = await submitWithFetch(actionUrl, params);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        renderStatus("success", successMessage);
        form.classList.add("signup-panel__form--complete");
        form.reset();
        logSignup({
          email,
          listId,
          tags,
          source,
          status: "success",
          ts: Date.now(),
        });
      } catch (error) {
        renderStatus("error", errorMessage);
        const popupUrl = `https://buttondown.email/${listId}?email=${encodeURIComponent(
          email,
        )}`;
        window.open(popupUrl, "popupwindow");
        try {
          form.removeEventListener("submit", handleSubmit);
          form.submit();
        } finally {
          form.addEventListener("submit", handleSubmit);
        }
        logSignup({
          email,
          listId,
          tags,
          source,
          status: "fallback",
          ts: Date.now(),
        });
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
        isSubmitting = false;
        form.classList.remove("signup-panel__form--pending");
      }
    }

    form.addEventListener("submit", handleSubmit);
  }

  function init() {
    const containers = document.querySelectorAll(SELECTOR);
    containers.forEach(setup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
