// ==============================
// menu.js - Premade Menu
// Handles Cart, Item Availability, and Owner Toggle
// ==============================

// ---------- FIREBASE AUTH ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const OWNER_EMAIL = "isabelmuniz001@gmail.com";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBQv3XZIt5ruMEec_HFFuzj6BOfY15d6g8",
  authDomain: "icecream-shop-b7af0.firebaseapp.com",
  projectId: "icecream-shop-b7af0",
  storageBucket: "icecream-shop-b7af0.firebasestorage.app",
  messagingSenderId: "809532079713",
  appId: "1:809532079713:web:74b8ecfc4501d28a3c3420",
  measurementId: "G-P5GVDVMQS6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Track if current user is the owner
window.isOwner = false;

// ---------- AVAILABILITY SYSTEM ----------
let itemAvailability = JSON.parse(localStorage.getItem("itemAvailability")) || {};


// Save availability to localStorage
function saveAvailability() {
  localStorage.setItem("itemAvailability", JSON.stringify(itemAvailability));
}

// CLEAN OLD INVALID VALUES
Object.keys(itemAvailability).forEach(k => {
  if (itemAvailability[k] !== false) {
    delete itemAvailability[k];
  }
});

saveAvailability();


// Check if an item is available
function isAvailable(id) {
  return itemAvailability[id] === undefined;
}

// Update UI for all menu cards
function updateAvailabilityUI() {
  document.querySelectorAll(".menu-card").forEach(card => {
    const itemId = card.dataset.id;
    const addBtns = card.querySelectorAll(".add-cart");
    const available = isAvailable(itemId);

    // Disable/enable Add to Cart buttons
    addBtns.forEach(btn => btn.disabled = !available);

    // Visual styling for availability
    card.classList.toggle("out-of-stock", !available);
    card.style.opacity = available ? "1" : "0.5";

    // Remove old toggle button
    const oldToggle = card.querySelector(".toggle-availability");
    if (oldToggle) oldToggle.remove();

    // Show owner toggle button only for owner
    if (window.isOwner) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-availability";
      toggleBtn.style.position = "relative";
      toggleBtn.style.zIndex = "10";
      toggleBtn.textContent = available ? "Set Out of Stock" : "Set Available";

        toggleBtn.addEventListener("click", () => {
    const currentlyAvailable = isAvailable(itemId);

    if (currentlyAvailable) {
      itemAvailability[itemId] = false;      // mark out-of-stock
    } else {
      delete itemAvailability[itemId];       // set available
    }

      saveAvailability();
      updateAvailabilityUI();
    });

      card.appendChild(toggleBtn);
    }
  });
}

// ---------- CART SYSTEM ----------
const CART_KEY = "site_cart_v1";

// Load cart from localStorage
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "{}");
  } catch {
    return {};
  }
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Add item to cart
function addToCart(id, name, price, size) {
  if (!isAvailable(id)) return;
  const cart = loadCart();
  const key = `${id}::${size || "default"}`;
  const displayName = size ? `${name} (${size})` : name;

  if (!cart[key]) cart[key] = { key, id, name: displayName, price: Number(price), qty: 0 };
  cart[key].qty += 1;
  saveCart(cart);
  renderCartCount();
}

// Remove item from cart
function removeFromCart(key) {
  const cart = loadCart();
  if (!cart[key]) return;
  delete cart[key];
  saveCart(cart);
  renderCart();
  renderCartCount();
}

// Change quantity of item in cart
function changeQty(key, delta) {
  const cart = loadCart();
  if (!cart[key]) return;
  cart[key].qty += delta;
  if (cart[key].qty <= 0) delete cart[key];
  saveCart(cart);
  renderCart();
  renderCartCount();
}

// Clear entire cart
function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCart();
  renderCartCount();
}

// Calculate total cart price
function cartTotal() {
  const cart = loadCart();
  return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
}

// Calculate total items in cart
function cartCount() {
  const cart = loadCart();
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

// Render cart count in UI
function renderCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cartCount();
}

// Render cart items in modal
function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  container.innerHTML = "";
  const cart = loadCart();

  if (Object.keys(cart).length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  Object.values(cart).forEach(item => {
    const div = document.createElement("div");
    div.className = "cart-line";
    div.innerHTML = `
      <div class="cart-line-left">
        <strong>${item.name}</strong>
        <div class="cart-line-price">$${item.price.toFixed(2)}</div>
      </div>
      <div class="cart-line-right">
        <button class="qty-btn" data-action="dec" data-key="${item.key}">-</button>
        <span class="qty">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-key="${item.key}">+</button>
        <button class="remove-btn" data-key="${item.key}">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });

  if (totalEl) totalEl.textContent = `$${cartTotal().toFixed(2)}`;
}

// Expose addToCart globally
window.addToCart = addToCart;

// ---------- AUTH STATE HANDLER ----------
onAuthStateChanged(auth, (user) => {
  window.isOwner = user?.email === OWNER_EMAIL;
  updateAvailabilityUI();
});

// ---------- INITIALIZATION ----------
document.addEventListener("DOMContentLoaded", () => {
  renderCartCount();
  updateAvailabilityUI();

  document.body.addEventListener("click", e => {
    const target = e.target;

    // Add to cart button
    if (target.closest(".add-cart")) {
      const btn = target.closest(".add-cart");
      addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price, btn.dataset.size);
      return;
    }

    // Open cart modal
    if (target.closest("#cartBtn")) {
      document.getElementById("cartModal").style.display = "block";
      renderCart();
      return;
    }

    // Close cart modal
    if (target.closest("#closeCart")) {
      document.getElementById("cartModal").style.display = "none";
      return;
    }

    // Clear cart
    if (target.closest("#clearCart")) {
      clearCart();
      return;
    }

    // Checkout button
    if (target.closest("#checkoutBtn")) {
      const cart = loadCart();
      if (Object.keys(cart).length === 0) {
        alert("Your cart is empty!");
        return;
      }
      window.location.href = "checkout.html";
      return;
    }

    // Remove item button
    if (target.closest(".remove-btn")) {
      removeFromCart(target.dataset.key);
      return;
    }

    // Quantity buttons
    if (target.closest(".qty-btn")) {
      const btn = target.closest(".qty-btn");
      changeQty(btn.dataset.key, btn.dataset.action === "inc" ? 1 : -1);
      return;
    }
  });
});
