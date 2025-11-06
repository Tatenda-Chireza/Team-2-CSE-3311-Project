// Simple cart implementation using in-memory storage
const CART_KEY = 'site_cart_v1';

/**
 * Loads the shopping cart from localStorage
 * @returns {Object} Cart object with items keyed by unique identifier
 */
function loadCart() {
  try {
    // Attempt to parse cart data from localStorage, return empty object if not found
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  } catch (e) {
    // Return empty cart if parsing fails (corrupted data)
    return {};
  }
}

/**
 * Saves the shopping cart to localStorage
 * @param {Object} cart - Cart object to save
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Adds an item to the shopping cart or increments quantity if already present
 * @param {string} id - Product ID
 * @param {string} name - Product name
 * @param {number} price - Product price
 * @param {string} size - Product size (optional)
 */
function addToCart(id, name, price, size) {
  const cart = loadCart();
  // Create unique key combining product ID and size
  const key = `${id}::${size || 'default'}`;
  // Include size in display name if provided
  const displayName = size ? `${name} (${size})` : name;
  // Initialize item if it doesn't exist in cart
  if (!cart[key]) cart[key] = { key, id, name: displayName, price: Number(price), qty: 0 };
  // Increment quantity
  cart[key].qty += 1;
  saveCart(cart);
  // Update cart count display in UI
  renderCartCount();
}

/**
 * Removes an item completely from the cart
 * @param {string} key - Unique cart item key
 */
function removeFromCart(key) {
  const cart = loadCart();
  if (!cart[key]) return;
  // Delete item from cart
  delete cart[key];
  saveCart(cart);
  // Refresh cart display
  renderCart();
  renderCartCount();
}

/**
 * Changes the quantity of a cart item
 * @param {string} key - Unique cart item key
 * @param {number} delta - Amount to change quantity by (+1 or -1)
 */
function changeQty(key, delta) {
  const cart = loadCart();
  if (!cart[key]) return;
  // Adjust quantity by delta
  cart[key].qty += delta;
  // Remove item if quantity drops to zero or below
  if (cart[key].qty <= 0) delete cart[key];
  saveCart(cart);
  // Refresh cart display
  renderCart();
  renderCartCount();
}

/**
 * Empties the entire shopping cart
 */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  // Refresh cart display
  renderCart();
  renderCartCount();
}

/**
 * Calculates the total price of all items in cart
 * @returns {number} Total cart value
 */
function cartTotal() {
  const cart = loadCart();
  let total = 0;
  // Sum up price × quantity for each item
  Object.values(cart).forEach(i => total += i.price * i.qty);
  return total;
}

/**
 * Calculates the total number of items in cart
 * @returns {number} Total item count
 */
function cartCount() {
  const cart = loadCart();
  // Sum up quantities of all items
  return Object.values(cart).reduce((s,i) => s + i.qty, 0);
}

/**
 * Updates the cart count badge in the UI
 */
function renderCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cartCount();
}

/**
 * Renders the complete cart display in the modal
 */
function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  // Clear existing content
  container.innerHTML = '';
  const cart = loadCart();
  // Display empty cart message if no items
  if (Object.keys(cart).length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    if (totalEl) totalEl.textContent = '$0.00';
    return;
  }
  // Create HTML for each cart item
  Object.values(cart).forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-line';
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
  // Update total price display
  if (totalEl) totalEl.textContent = `$${cartTotal().toFixed(2)}`;
}

// Initialize cart functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Display initial cart count
  renderCartCount();

  // Event delegation for all cart-related buttons
  document.body.addEventListener('click', e => {
    // Handle "Add to Cart" button clicks
    const add = e.target.closest('.add-cart');
    if (add) {
      addToCart(add.dataset.id, add.dataset.name, add.dataset.price, add.dataset.size);
      return;
    }

    // Handle cart icon/button click to open modal
    const cartBtn = e.target.closest('#cartBtn');
    if (cartBtn) {
      document.getElementById('cartModal').style.display = 'block';
      renderCart();
      return;
    }

    // Handle close cart modal button
    const close = e.target.closest('#closeCart');
    if (close) {
      document.getElementById('cartModal').style.display = 'none';
      return;
    }

    // Handle clear cart button
    const clear = e.target.closest('#clearCart');
    if (clear) { clearCart(); return; }

    // Handle checkout button click
    const checkout = e.target.closest('#checkoutBtn');
    if (checkout) {
      // Check if cart is empty
      const cart = loadCart();
      if (Object.keys(cart).length === 0) {
        alert('Your cart is empty!');
        return;
      }
      // Redirect to checkout page
      window.location.href = 'checkout.html';
      return;
    }

    // Handle remove item button
    const remove = e.target.closest('.remove-btn');
    if (remove) { removeFromCart(remove.dataset.key); return; }

    // Handle quantity increment/decrement buttons
    const qty = e.target.closest('.qty-btn');
    if (qty) {
      const key = qty.dataset.key;
      const action = qty.dataset.action;
      // Increment if "inc" action, decrement if "dec"
      changeQty(key, action === 'inc' ? 1 : -1);
      return;
    }
  });
});