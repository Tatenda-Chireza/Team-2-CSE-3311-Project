// auth.js - Handles Firebase authentication and user session management

// Import Firebase app initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

// Import Firebase authentication methods
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Optional analytics (only if you want it and page is served over HTTPS or localhost)
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

// Global function to force logout - can be called from browser console for debugging
window.forceLogout = async () => { try { await signOut(auth); } catch {} };

// Firebase project configuration object containing API keys and project identifiers
const firebaseConfig = {
  apiKey: "AIzaSyBQv3XZIt5ruMEec_HFFuzj6BOfY15d6g8",
  authDomain: "icecream-shop-b7af0.firebaseapp.com",
  projectId: "icecream-shop-b7af0",
  storageBucket: "icecream-shop-b7af0.firebasestorage.app",
  messagingSenderId: "809532079713",
  appId: "1:809532079713:web:74b8ecfc4501d28a3c3420",
  measurementId: "G-P5GVDVMQS6" // optional
};

// Initialize Firebase app with the configuration
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // optional

// Create and export the authentication instance for use in other modules
export const auth = getAuth(app);

// ---- Header greeting: "Hi, Name" ----

/**
 * Extracts the first name from a display name or email address
 * @param {string} displayName - The user's display name
 * @param {string} email - The user's email address
 * @returns {string} The first name or email username or "User" as fallback
 */
function firstNameFromDisplayName(displayName, email) {
  if (displayName && displayName.trim()) return displayName.trim().split(/\s+/)[0];
  return email ? email.split("@")[0] : "User";
}

/**
 * Updates the header UI based on user authentication state
 * Changes sign up button to greeting when logged in, shows/hides logout button
 * @param {Object|null} user - Firebase user object or null if not authenticated
 */
function updateHeader(user) {
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!signupBtn) return;

  if (user) {
    // User is logged in: show personalized greeting
    const name = firstNameFromDisplayName(user.displayName, user.email);
    signupBtn.textContent = `Hi, ${name}`;
    signupBtn.href = "#";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    // User is logged out: show sign up link
    signupBtn.textContent = "Sign up";
    signupBtn.href = "signup.html";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

// Set up authentication state listener - updates header whenever auth state changes
onAuthStateChanged(auth, user => updateHeader(user));

// Event delegation for logout button click handling
// Uses event delegation on document to handle dynamically shown/hidden logout button
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#logoutBtn');
  if (!btn) return;
  e.preventDefault();
  try { await signOut(auth); } catch (err) { console.error(err); }
});

// Initialize header on page load with current authentication state
// Ensures header displays correctly even before onAuthStateChanged fires
document.addEventListener('DOMContentLoaded', () => {
  updateHeader(auth.currentUser);
});