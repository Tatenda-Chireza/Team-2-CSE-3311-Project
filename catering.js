// ============================================================================
// HELPER FUNCTIONS & DOM REFERENCES
// ============================================================================

// Utility function for quick DOM selection
const $ = (sel) => document.querySelector(sel);

// Cache all DOM element references
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

// Set minimum date to today to prevent past date selection
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

// Opens the catering modal and prepares it for user input
function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  // Hide success view and show form
  successView?.setAttribute("hidden", "");
  form?.removeAttribute("hidden");
  $("#caterSubmit")?.removeAttribute("disabled");
  // Focus first interactive element for keyboard accessibility
  const first = form?.querySelector("input, textarea, select, button");
  first?.focus();
  trapFocus(modal);
}

// Closes the modal and resets all form state
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  // Clear status messages and error states
  statusEl.textContent = "";
  statusEl.className = "cater-status";
  clearErrors();
  // Reset form to initial values
  form?.reset();
}

// Event listener: Open modal when button clicked
openBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });

// Event listener: Close modal when close button clicked
closeBtn?.addEventListener("click", closeModal);

// Event listener: Close modal when overlay (background) clicked
overlay?.addEventListener("click", closeModal);

// Event listener: Close modal when Escape key pressed
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// ============================================================================
// FOCUS TRAP FOR ACCESSIBILITY
// ============================================================================

// Stores the element that had focus before modal opened
let lastFocused;

// Traps keyboard focus within the modal for accessibility compliance
function trapFocus(container) {
  // Get all focusable elements within the container
  const focusable = container.querySelectorAll(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  // Remember what was focused before modal opened
  lastFocused = document.activeElement;

  // Handle Tab and Shift+Tab to cycle focus within modal
  function handle(e) {
    if (e.key !== "Tab") return;
    // If Shift+Tab on first element, wrap to last
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    // If Tab on last element, wrap to first
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

// Validates all form fields and returns true if all valid
function validate() {
  clearErrors();
  let ok = true;

  // Get trimmed values from form inputs
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const date = form.date.value.trim();
  const guests = Number(form.guests.value);

  // Validate name is not empty
  if (!name) { setError(form.name, "Please enter your name"); ok = false; }

  // Validate email format using regex
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError(form.email, "Enter a valid email");
    ok = false;
  }

  // Validate date is selected
  if (!date) { setError(form.date, "Select a date"); ok = false; }

  // Validate guest count is at least 1
  if (!guests || guests < 1) {
    setError(form.guests, "At least 1 guest");
    ok = false;
  }

  return ok;
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

// Toggles the submit button loading state
function setLoading(loading) {
  if (!submitBtn) return;
  if (loading) {
    // Disable button and show loading indicator
    submitBtn.setAttribute("disabled", "true");
    submitBtn.classList.add("is-loading");
  } else {
    // Re-enable button and remove loading indicator
    submitBtn.removeAttribute("disabled");
    submitBtn.classList.remove("is-loading");
  }
}

// Displays a status message with optional styling type
function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `cater-status ${type || ""}`;
}

// ============================================================================
// FORM SUBMISSION
// ============================================================================

// Handle form submission with async API call
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Validate form before submitting
  if (!validate()) {
    showStatus("Please correct the highlighted fields.", "error");
    return;
  }

  // Prepare payload with form data
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
    
    // Send POST request to catering API endpoint
    const res = await fetch("/api/catering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    // Check if request was successful
    if (!res.ok) throw new Error("Network error");

    // Show success view and hide form
    form.setAttribute("hidden", "");
    successView.removeAttribute("hidden");
    // Focus the done button for accessibility
    $("#caterDone")?.focus();
  } catch (err) {
    // Show error message if submission fails
    showStatus("Couldn't reach server. Please try again in a moment.", "error");
  } finally {
    // Always remove loading state
    setLoading(false);
  }
});

// ============================================================================
// SUCCESS VIEW
// ============================================================================

// Close modal when user clicks "Done" after successful submission
doneBtn?.addEventListener("click", () => {
  closeModal();
});