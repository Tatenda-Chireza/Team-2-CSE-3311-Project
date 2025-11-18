// ============================================================================
// HELPER FUNCTIONS & DOM REFERENCES
// ============================================================================

const $ = (sel) => document.querySelector(sel);

const modal = $("#cateringModal");
const overlay = $("#cateringOverlay");
const openBtn = $("#openCatering");
const closeBtn = $("#closeCatering");
const form = $("#cateringForm");
const statusEl = $("#cateringStatus");
const dateInput = $("#eventDate");
const submitBtn = $("#caterSubmit");
const successView = $("#caterSuccess");
const doneBtn = $("#caterDone");

// ============================================================================
// DATE INPUT INITIALIZATION
// ============================================================================

(function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const min = `${yyyy}-${mm}-${dd}`;
  if (dateInput) dateInput.min = min;
})();

// ============================================================================
// MODAL CONTROL FUNCTIONS
// ============================================================================

function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  successView?.setAttribute("hidden", "");
  form?.removeAttribute("hidden");
  $("#caterSubmit")?.removeAttribute("disabled");

  // When modal opens, sync name/email with logged-in user if available
  applyLoggedInUserToCatering();

  const first = form?.querySelector("input, textarea, select, button");
  first?.focus();
  trapFocus(modal);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  statusEl.textContent = "";
  statusEl.className = "cater-status";
  clearErrors();
  form?.reset();
}

openBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
closeBtn?.addEventListener("click", closeModal);
overlay?.addEventListener("click", closeModal);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// ============================================================================
// FOCUS TRAP FOR ACCESSIBILITY
// ============================================================================

let lastFocused;

function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  lastFocused = document.activeElement;

  function handle(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  container.addEventListener("keydown", handle);
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

function clearErrors() {
  form?.querySelectorAll(".cater-error").forEach(e => e.textContent = "");
}

function setError(inputEl, msg) {
  const field = inputEl.closest(".cater-field");
  const err = field?.querySelector(".cater-error");
  if (err) err.textContent = msg || "";
}

function validate() {
  clearErrors();
  let ok = true;

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const date = form.date.value.trim();
  const guests = Number(form.guests.value);

  if (!name) { setError(form.name, "Please enter your name"); ok = false; }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError(form.email, "Enter a valid email");
    ok = false;
  }

  if (!date) { setError(form.date, "Select a date"); ok = false; }

  if (!guests || guests < 1) {
    setError(form.guests, "At least 1 guest");
    ok = false;
  }

  return ok;
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

function setLoading(loading) {
  if (!submitBtn) return;
  if (loading) {
    submitBtn.setAttribute("disabled", "true");
    submitBtn.classList.add("is-loading");
  } else {
    submitBtn.removeAttribute("disabled");
    submitBtn.classList.remove("is-loading");
  }
}

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `cater-status ${type || ""}`;
}

// ============================================================================
// FORM SUBMISSION
// ============================================================================

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validate()) {
    showStatus("Please correct the highlighted fields.", "error");
    return;
  }

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    date: form.date.value.trim(),
    guests: Number(form.guests.value),
    notes: form.notes.value.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    setLoading(true);
    showStatus("", "");

    const res = await fetch("/api/catering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Network error");

    form.setAttribute("hidden", "");
    successView.removeAttribute("hidden");
    $("#caterDone")?.focus();
  } catch (err) {
    console.error(err);
    showStatus("Couldn't reach server. Please try again in a moment.", "error");
  } finally {
    setLoading(false);
  }
});

// ============================================================================
// SUCCESS VIEW
// ============================================================================

doneBtn?.addEventListener("click", () => {
  closeModal();
});

// ============================================================================
// LOGGED-IN USER INTEGRATION
// ============================================================================

/**
 * Reads window.currentUserInfo (set by auth.js) and, if available,
 * pre-fills name + email for catering. This way logged-in users
 * don’t have to retype them.
 */
function applyLoggedInUserToCatering() {
  if (!form) return;
  const info = window.currentUserInfo || null;
  if (!info || !info.email) {
    // Logged out → make sure fields are editable & empty
    if (form.name) {
      form.name.readOnly = false;
      if (!form.name.dataset.manuallyEdited) form.name.value = "";
    }
    if (form.email) {
      form.email.readOnly = false;
      if (!form.email.dataset.manuallyEdited) form.email.value = "";
    }
    return;
  }

  // Logged in: pre-fill and lock
  if (form.name) {
    if (!form.name.dataset.manuallyEdited) form.name.value = info.name || info.email.split("@")[0];
    form.name.readOnly = true;
  }
  if (form.email) {
    if (!form.email.dataset.manuallyEdited) form.email.value = info.email;
    form.email.readOnly = true;
  }
}

// Run once on initial load
document.addEventListener("DOMContentLoaded", applyLoggedInUserToCatering);

// React to login/logout changes from auth.js
window.addEventListener("app:user-changed", applyLoggedInUserToCatering);
