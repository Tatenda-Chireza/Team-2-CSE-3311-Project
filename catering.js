// ============================================================================
// HELPER FUNCTIONS & DOM REFERENCES
// ============================================================================

// Utility function for shorter querySelector syntax
const $ = (sel) => document.querySelector(sel);

// Cache DOM element references for the catering modal and its components
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

// Set the minimum date for the event date picker to today's date
// This prevents users from selecting dates in the past
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

// Opens the catering modal and resets it to the form view
function openModal() {
  // Show the modal with CSS class
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  
  // Hide success view and show form
  successView?.setAttribute("hidden", "");
  form?.removeAttribute("hidden");
  $("#caterSubmit")?.removeAttribute("disabled");

  // When modal opens, sync name/email with logged-in user if available
  applyLoggedInUserToCatering();

  // Focus the first interactive element for accessibility
  const first = form?.querySelector("input, textarea, select, button");
  first?.focus();
  
  // Enable keyboard focus trapping within the modal
  trapFocus(modal);
}

// Closes the modal and resets all form state
function closeModal() {
  // Hide the modal
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  
  // Clear status messages and error states
  statusEl.textContent = "";
  statusEl.className = "cater-status";
  clearErrors();
  
  // Reset form to initial state
  form?.reset();
}

// Event listener to open modal when button is clicked
openBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });

// Event listener to close modal when close button is clicked
closeBtn?.addEventListener("click", closeModal);

// Event listener to close modal when clicking on overlay backdrop
overlay?.addEventListener("click", closeModal);

// Global keyboard listener to close modal with Escape key
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// ============================================================================
// FOCUS TRAP FOR ACCESSIBILITY
// ============================================================================

// Store the last focused element before opening modal (for restoration later)
let lastFocused;

// Traps keyboard focus within the modal for accessibility compliance
// Prevents tabbing outside the modal when it's open
function trapFocus(container) {
  // Get all focusable elements within the container
  const focusable = container.querySelectorAll(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  
  // Remember what was focused before opening modal
  lastFocused = document.activeElement;

  // Handle Tab key presses to loop focus within modal
  function handle(e) {
    if (e.key !== "Tab") return;
    
    // If shift+tab on first element, go to last
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } 
    // If tab on last element, go to first
    else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  container.addEventListener("keydown", handle);
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

// Clears all error messages from the form
function clearErrors() {
  form?.querySelectorAll(".cater-error").forEach(e => e.textContent = "");
}

// Displays an error message for a specific input field
function setError(inputEl, msg) {
  const field = inputEl.closest(".cater-field");
  const err = field?.querySelector(".cater-error");
  if (err) err.textContent = msg || "";
}

// Validates all form fields and returns true if valid, false otherwise
// Also displays appropriate error messages for invalid fields
function validate() {
  clearErrors();
  let ok = true;

  // Get trimmed values from form fields
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const date = form.date.value.trim();
  const guests = Number(form.guests.value);

  // Validate name field (required)
  if (!name) { setError(form.name, "Please enter your name"); ok = false; }

  // Validate email field (required and must be valid format)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError(form.email, "Enter a valid email");
    ok = false;
  }

  // Validate date field (required)
  if (!date) { setError(form.date, "Select a date"); ok = false; }

  // Validate guest count (must be at least 1)
  if (!guests || guests < 1) {
    setError(form.guests, "At least 1 guest");
    ok = false;
  }

  return ok;
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

// Toggles the loading state of the submit button
// When loading, button is disabled and shows loading indicator
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

// Displays a status message with optional type (e.g., "error", "success")
function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `cater-status ${type || ""}`;
}

// ============================================================================
// FORM SUBMISSION
// ============================================================================

// Handles form submission via AJAX
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate form before submitting
  if (!validate()) {
    showStatus("Please correct the highlighted fields.", "error");
    return;
  }

  // Prepare payload object with form data
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    date: form.date.value.trim(),
    guests: Number(form.guests.value),
    notes: form.notes.value.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    // Show loading state
    setLoading(true);
    showStatus("", "");

    // Send POST request to server
    const res = await fetch("/api/catering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Check if request was successful
    if (!res.ok) throw new Error("Network error");

    // On success, hide form and show success view
    form.setAttribute("hidden", "");
    successView.removeAttribute("hidden");
    $("#caterDone")?.focus();
  } catch (err) {
    // Handle errors by showing error message
    console.error(err);
    showStatus("Couldn't reach server. Please try again in a moment.", "error");
  } finally {
    // Always remove loading state when done
    setLoading(false);
  }
});

// ============================================================================
// SUCCESS VIEW
// ============================================================================

// Event listener for "Done" button in success view
// Closes the modal when clicked
doneBtn?.addEventListener("click", () => {
  closeModal();
});

// ============================================================================
// LOGGED-IN USER INTEGRATION
// ============================================================================

/**
 * Reads window.currentUserInfo (set by auth.js) and, if available,
 * pre-fills name + email for catering. This way logged-in users
 * don't have to retype them.
 */
function applyLoggedInUserToCatering() {
  if (!form) return;
  
  // Get current user info from global variable (set by auth.js)
  const info = window.currentUserInfo || null;
  
  // If user is logged out, make fields editable and empty
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

  // If user is logged in, pre-fill name and email fields and make them read-only
  // Logged in: pre-fill and lock
  if (form.name) {
    // Use user's name, or extract from email if name not available
    if (!form.name.dataset.manuallyEdited) form.name.value = info.name || info.email.split("@")[0];
    form.name.readOnly = true;
  }
  if (form.email) {
    if (!form.email.dataset.manuallyEdited) form.email.value = info.email;
    form.email.readOnly = true;
  }
}

// Run once on initial load to apply logged-in user data if available
document.addEventListener("DOMContentLoaded", applyLoggedInUserToCatering);

// React to login/logout changes from auth.js
// When user logs in or out, update the form fields accordingly
window.addEventListener("app:user-changed", applyLoggedInUserToCatering);