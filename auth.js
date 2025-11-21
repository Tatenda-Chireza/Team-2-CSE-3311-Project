// auth.js - Handles Firebase authentication and user session management

// Import Firebase app initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

// Import Firebase authentication methods
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

export const OWNER_EMAIL = "isabelmuniz001@gmail.com";

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

// Create and export the authentication instance for use in other modules
export const auth = getAuth(app);

/**
 * Extracts the first name from a display name or email address
 * @param {string} displayName - The user's display name
 * @param {string} email - The user's email address
 * @returns {string} The first name or email username or "User" as fallback
 */
function firstNameFromDisplayName(displayName, email) {
  // If display name exists and isn't empty, split on whitespace and return first word
  if (displayName && displayName.trim()) return displayName.trim().split(/\s+/)[0];
  // Otherwise extract username portion before @ symbol from email, or return "User"
  return email ? email.split("@")[0] : "User";
}

/**
 * Makes the current user info available to non-module scripts
 * and notifies any listeners (checkout, catering, etc.)
 * @param {import("firebase/auth").User|null} user
 */
function exposeUser(user) {
  if (user) {
    // Extract the first name from the user's display name or email
    const name = firstNameFromDisplayName(user.displayName, user.email || "");
    // Create a simplified user info object on the window object for global access
    window.currentUserInfo = {
      name,
      email: user.email || null,
      rawUser: user
    };
  } else {
    // Clear the user info when logged out
    window.currentUserInfo = null;
  }

  // Fire a custom event so pages can react when login state changes
  window.dispatchEvent(new CustomEvent("app:user-changed", {
    detail: window.currentUserInfo
  }));
}

/**
 * Updates the header UI based on user authentication state
 * Changes sign up button to greeting when logged in, shows/hides logout button
 * @param {Object|null} user - Firebase user object or null if not authenticated
 */
function updateHeader(user) {
  // Get references to the sign up and logout buttons in the header
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  // If sign up button doesn't exist (page without header), just expose user and return
  if (!signupBtn) {
    exposeUser(user);
    return;
  }

  if (user) {
    // User is logged in: change button text to greeting with user's first name
    const name = firstNameFromDisplayName(user.displayName, user.email);
    signupBtn.textContent = `Hi, ${name}`;
    signupBtn.href = "#"; // Remove the link since user is already logged in
    // Show the logout button if it exists
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    // User is logged out: reset button to default "Sign up" text and link
    signupBtn.textContent = "Sign up";
    signupBtn.href = "signup.html";
    // Hide the logout button
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  // Make user info available globally after updating the header
  exposeUser(user);
}

// Set up authentication state listener - updates header whenever auth state changes
// This listener fires on page load and whenever user logs in or out
onAuthStateChanged(auth, user => updateHeader(user));

// Event delegation for logout button click handling
// Uses event delegation on document to handle clicks even if button added dynamically
document.addEventListener('click', async (e) => {
  // Check if the clicked element is or is inside the logout button
  const btn = e.target.closest('#logoutBtn');
  if (!btn) return; // Not a logout button click, ignore
  
  // Prevent default link behavior
  e.preventDefault();
  
  // Attempt to sign out the user, silently catch any errors
  try { await signOut(auth); } catch (err) { console.error(err); }
});

// Initialize header on page load with current authentication state
// This ensures the header displays correctly even before onAuthStateChanged fires
document.addEventListener('DOMContentLoaded', () => {
  updateHeader(auth.currentUser);
});