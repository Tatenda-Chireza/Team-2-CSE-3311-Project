// Simple cart implementation using in-memory storage
const CART_KEY = 'site_cart_v1';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
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
  localStorage.removeItem(CART_KEY);
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
  return Object.values(cart).reduce((s,i) => s + i.qty, 0);
}

function renderCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cartCount();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
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

document.addEventListener('DOMContentLoaded', () => {
  renderCartCount();

  document.body.addEventListener('click', e => {
    const add = e.target.closest('.add-cart');
    if (add) {
      addToCart(add.dataset.id, add.dataset.name, add.dataset.price, add.dataset.size);
      return;
    }

    const cartBtn = e.target.closest('#cartBtn');
    if (cartBtn) {
      document.getElementById('cartModal').style.display = 'block';
      renderCart();
      return;
    }

    const close = e.target.closest('#closeCart');
    if (close) {
      document.getElementById('cartModal').style.display = 'none';
      return;
    }

    const clear = e.target.closest('#clearCart');
    if (clear) { clearCart(); return; }

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

    const remove = e.target.closest('.remove-btn');
    if (remove) { removeFromCart(remove.dataset.key); return; }

    const qty = e.target.closest('.qty-btn');
    if (qty) {
      const key = qty.dataset.key;
      const action = qty.dataset.action;
      changeQty(key, action === 'inc' ? 1 : -1);
      return;
    }
  });
});