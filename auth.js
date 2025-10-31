// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
// Optional analytics (only if you want it and page is served over HTTPS or localhost)
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

window.forceLogout = async () => { try { await signOut(auth); } catch {} };

const firebaseConfig = {
  apiKey: "AIzaSyBQv3XZIt5ruMEec_HFFuzj6BOfY15d6g8",
  authDomain: "icecream-shop-b7af0.firebaseapp.com",
  projectId: "icecream-shop-b7af0",
  storageBucket: "icecream-shop-b7af0.firebasestorage.app",
  messagingSenderId: "809532079713",
  appId: "1:809532079713:web:74b8ecfc4501d28a3c3420",
  measurementId: "G-P5GVDVMQS6" // optional
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // optional

export const auth = getAuth(app);

// ---- Header greeting: "Hi, Name" ----
function firstNameFromDisplayName(displayName, email) {
  if (displayName && displayName.trim()) return displayName.trim().split(/\s+/)[0];
  return email ? email.split("@")[0] : "User";
}

function updateHeader(user) {
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!signupBtn) return;

  if (user) {
    const name = firstNameFromDisplayName(user.displayName, user.email);
    signupBtn.textContent = `Hi, ${name}`;
    signupBtn.href = "#";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    signupBtn.textContent = "Sign up";
    signupBtn.href = "signup.html";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

onAuthStateChanged(auth, user => updateHeader(user));

// auth.js
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#logoutBtn');
  if (!btn) return;
  e.preventDefault();
  try { await signOut(auth); } catch (err) { console.error(err); }
});


document.addEventListener('DOMContentLoaded', () => {
  updateHeader(auth.currentUser);
});


