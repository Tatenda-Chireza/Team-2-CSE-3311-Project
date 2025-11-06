// menu.js — unified, robust cart for Pre-Made + BYO

// -------- Safe storage wrapper (handles private-mode / blocked storage) -------
const CART_KEY = 'site_cart_v1';

const safeStorage = (() => {
  try {
    const testKey = '__cart_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return {
      get: (k) => window.localStorage.getItem(k),
      set: (k, v) => window.localStorage.setItem(k, v),
      remove: (k) => window.localStorage.removeItem(k),
      ok: true,
    };
  } catch {
    // Fallback to in-memory storage if localStorage is unavailable
    const mem = new Map();
    return {
      get: (k) => (mem.has(k) ? mem.get(k) : null),
      set: (k, v) => mem.set(k, v),
      remove: (k) => mem.delete(k),
      ok: false,
    };
  }
})();

// ----------------------------- Cart core -------------------------------------
function loadCart() {
  try {
    return JSON.parse(safeStorage.get(CART_KEY) || '{}');
  } catch {
    // corrupted JSON → reset
    return {};
  }
}

function saveCart(cart) {
  try {
    safeStorage.set(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Cart save failed:', e);
    // If saving fails, keep going so UI still updates
  }
}

function addToCart(id, name, price, size) {
  const cart = loadCart();
  const key = `${id}::${size || 'default'}`;
  const displayName = size ? `${name} (${size})` : name;
  if (!cart[key]) cart[key] = { key, id, name: displayName, price: Number(price), qty: 0 };
  cart[key].qty += 1;
  saveCart(cart);
  renderCartCount();
}

function removeFromCart(key) {
  const cart = loadCart();
  if (!cart[key]) return;
  delete cart[key];
  saveCart(cart);
  renderCart();
  renderCartCount();
}

function changeQty(key, delta) {
  const cart = loadCart();
  if (!cart[key]) return;
  cart[key].qty += delta;
  if (cart[key].qty <= 0) delete cart[key];
  saveCart(cart);
  renderCart();
  renderCartCount();
}

function clearCart() {
  try { safeStorage.remove(CART_KEY); } catch {}
  renderCart();
  renderCartCount();
}

function cartTotal() {
  const cart = loadCart();
  let total = 0;
  Object.values(cart).forEach(i => total += i.price * i.qty);
  return total;
}

function cartCount() {
  const cart = loadCart();
  return Object.values(cart).reduce((s, i) => s + i.qty, 0);
}

function renderCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cartCount();
}

// ----------------------------- Cart modal UI ---------------------------------
function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl   = document.getElementById('cartTotal');
  if (!container) return;

  container.innerHTML = '';
  const cart = loadCart();

  if (Object.keys(cart).length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    if (totalEl) totalEl.textContent = '$0.00';
    return;
  }

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

  if (totalEl) totalEl.textContent = `$${cartTotal().toFixed(2)}`;
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderCart();
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Expose for BYO (build.js calls window.openCart if present)
window.openCart = openCartModal;

// --------------------------- Event delegation --------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Initial badge
  renderCartCount();

  // One body listener for everything
  document.body.addEventListener('click', (e) => {
    // 1) Add-to-cart (works if you click button or any child)
    const addBtn = e.target.closest('.add-cart');
    if (addBtn) {
      e.preventDefault();
      const { id, name, price, size } = addBtn.dataset;
      if (id && name && price) addToCart(id, name, price, size);
      return;
    }

    // 2) Open cart from header
    const cartBtn = e.target.closest('#cartBtn');
    if (cartBtn) {
      e.preventDefault();
      openCartModal();
      return;
    }

    // 3) Close cart
    const close = e.target.closest('#closeCart');
    if (close) { closeCartModal(); return; }

    // 4) Clear cart
    const clear = e.target.closest('#clearCart');
    if (clear) { clearCart(); return; }

    // 5) Checkout
    const checkout = e.target.closest('#checkoutBtn');
    if (checkout) {
      const cart = loadCart();
      if (Object.keys(cart).length === 0) {
        alert('Your cart is empty!');
        return;
      }
      window.location.href = 'checkout.html';
      return;
    }

    // 6) Remove line
    const remove = e.target.closest('.remove-btn');
    if (remove) { removeFromCart(remove.dataset.key); return; }

    // 7) Qty +/- inside cart
    const qty = e.target.closest('.qty-btn');
    if (qty && qty.dataset.key && qty.dataset.action) {
      changeQty(qty.dataset.key, qty.dataset.action === 'inc' ? 1 : -1);
      return;
    }
  });

  // Gracefully recover if storage gets cleared in another tab
  window.addEventListener('storage', (ev) => {
    if (ev.key === CART_KEY) {
      renderCartCount();
      renderCart();
    }
  });
});
