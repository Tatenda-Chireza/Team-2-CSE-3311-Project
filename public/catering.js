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

// ★ Force API to your Node server (3000 in dev)
const API_BASE =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:3000"
    : `${location.protocol}//${location.host}`;

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
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
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
    setError(form.email, "Enter a valid email"); ok = false;
  }
  if (!date) { setError(form.date, "Select a date"); ok = false; }
  if (!guests || guests < 1) { setError(form.guests, "At least 1 guest"); ok = false; }

  return ok;
}

// ============================================================================
// UI STATE
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

    // ★ Force to your Node server (port 3000 in dev)
    const url = `${API_BASE}/api/catering`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Token": "catering-test" // ★ handy for server logs
      },
      body: JSON.stringify(payload)
    });

    // ★ Helpful debug logs
    console.log("[catering] POST", url, payload, "→ status", res.status);

    // Parse response (may not always be JSON if proxy intercepts)
    let data = null;
    try { data = await res.json(); } catch { /* ignore */ }

    if (!res.ok) {
      console.warn("[catering] server error:", data || res.statusText);
      throw new Error(data?.error || `Server responded ${res.status}`);
    }

    // success → swap views
    form.setAttribute("hidden", "");
    successView.removeAttribute("hidden");
    $("#caterDone")?.focus();
  } catch (err) {
    console.error("[catering] submit failed:", err);
    showStatus("Couldn't reach server at http://localhost:3000. Make sure you opened the site from the Node server, not Live Server.", "error");
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
