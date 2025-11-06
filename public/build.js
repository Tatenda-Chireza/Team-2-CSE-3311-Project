// build.js — BYO grid + modal
// Sizes: Small $5.25, Regular $7.25
// Pricing: included up to LIMITS[size].maxTotal; up to 2 extras cost $0.50 each

// ========== DATA DEFINITIONS ==========

// Array of base flavor options with metadata (id, name, image path, description with calories)
const BASE_FLAVORS = [
  { id:'original',  name:'Original (Vanilla)', img:'/img/original.jpeg',  desc:'Classic vanilla base. Calories: 415' },
  { id:'df-vanilla',name:'Dairy Free (Vanilla)', img:'/img/dairyfree.jpeg',  desc:'Dairy-free vanilla (Almond Milk). Calories: 250' },
  { id:'chocolate', name:'Chocolate', img:'/img/chocolate.jpeg',  desc:'Rich chocolate. Calories: 450' },
  { id:'mango',     name:'Mango', img:'/img/mango.jpeg',  desc:'Tropical mango. Calories: 300' },
  { id:'green-tea', name:'Green Tea', img:'/img/greentea.jpeg',  desc:'Matcha-style. Calories: 315' },
  { id:'thai-tea',  name:'Thai Tea', img:'/img/thaitea.jpeg',  desc:'Spiced tea flavor. Calories: 350' },
  { id:'taro',      name:'Taro', img:'/img/taro.jpeg',  desc:'Creamy taro. Calories: 420' },
  { id:'milk-tea',  name:'Milk Tea', img:'/img/milktea.jpeg',  desc:'Milk tea base. Calories: 300' },
  { id:'coffee',    name:'Coffee', img:'/img/coffee.jpeg',  desc:'Coffee kick. Calories: 415' }
];

// Available cup sizes with pricing
const SIZES = [
  { id:'small',   label:'Small',   price:5.25 },
  { id:'regular', label:'Regular', price:7.25 }
];

// Available toppings - transformed from array of names to objects with id and name
// IDs are created by lowercasing and replacing spaces with hyphens
const TOPPINGS = [
  'Almonds','Banana','Blackberry','Blueberry','Brownie','Caramel Sauce',
  'Cherry','Cheesecake Bites','Chocolate Chips','Chocolate Sauce','Coconut Shreds',
  'Condensed Milk','Cookie Dough','Ferrero','Fruit Loops','Fruity Pebbles','Gummy Bear',
  'Graham','Longan','Lychee','M&M\'s','Marshmallow','Mochi','Nutella','Oreo',
  'Panda Cookies','Cookies & Cream Pocky','Chocolate Pocky','Strawberry Pocky',
  'Peach','Pecan','Pineapple','Raspberry','Pretzels','Reese\'s','Sour Punch',
  'Sprinkles','Strawberry','Wafer','Whip Cream','White Chocolate Sauce'
].map(n => ({ id: n.toLowerCase().replace(/\s+/g,'-'), name: n }));

// Available mix-ins - transformed from array of names to objects with id and name
const MIXES = [
  'Banana','Blackberry','Blueberry','Brownie','Cheesecake','Coconut','Condensed Milk',
  'Fruity Pebbles','Graham','Lychee','Nutella','Oreo','Peach','Pineapple','Raspberry',
  'Sprinkles','Strawberry','Chocolate Sauce'
].map(n => ({ id: n.toLowerCase().replace(/\s+/g,'-'), name: n }));

// Pricing rules: maxTotal = number of included items; extra items beyond this are charged
// Each size has example combinations shown in the description array
const LIMITS = {
  small:   { maxTotal: 3, description: ["1 Mix-in + 2 Toppings","2 Mix-ins + 1 Topping","0 Mix-ins + 2 Toppings"] },
  regular: { maxTotal: 4, description: ["1 Mix-in + 3 Toppings","2 Mix-ins + 2 Toppings","0 Mix-ins + 3 Toppings"] }
};

// Extra item pricing constants
const EXTRA_PRICE = 0.50;  // Cost per extra item beyond included limit
const MAX_EXTRAS  = 2;     // Maximum number of extra items allowed

// ========== UTILITY FUNCTIONS ==========

// Shorthand query selectors for cleaner code
const $  = (q)=>document.querySelector(q);       // Select single element
const $$ = (q)=>Array.from(document.querySelectorAll(q));  // Select multiple elements as array

// Reference to the modal element
const modal = $('#byoModal');

// ========== STATE MANAGEMENT ==========

// Current order state - tracks all user selections in the modal
let current = {
  base: null,     // Selected base flavor object {id,name,desc,img}
  size: 'regular', // Selected size ('small' or 'regular')
  toppings: {},   // Selected toppings as {id: quantity}
  mixes: {},      // Selected mix-ins as {id: quantity}
  qty: 1,         // Quantity of this customized item
  notes: ''       // Special instructions from user
};

// ========== GRID RENDERING ==========

// Renders the grid of flavor cards on the main page
function renderFlavorGrid() {
  const grid = $('#flavorGrid');
  grid.innerHTML = '';
  BASE_FLAVORS.forEach(f => {
    // Create a button element for each flavor
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'flavor-card';
    card.innerHTML = `
      <img src="${f.img}" alt="${f.name}">
      <div class="flavor-name">${f.name}</div>
      <div class="flavor-meta">Choose to customize</div>
    `;
    // Open customization modal when flavor is clicked
    card.addEventListener('click', ()=> openModal(f));
    grid.appendChild(card);
  });
}

// ========== MODAL OPERATIONS ==========

// Opens the customization modal for the selected base flavor
function openModal(base) {
  // Reset current order state with selected base
  current.base = base;
  current.size = 'regular';
  current.toppings = {};
  current.mixes = {};
  current.qty = 1;
  current.notes = '';

  // Populate modal header with base flavor information
  $('#mImg').src = base.img;
  $('#mImg').alt = base.name;
  $('#modalTitle').textContent = base.name;
  $('#mDesc').textContent = base.desc;
  $('#qtyVal').textContent = '1';

  // Render size selection buttons
  const sr = $('#sizeRow'); sr.innerHTML = '';
  SIZES.forEach(s => {
    const b = document.createElement('button');
    b.type='button';
    b.className='opt-btn';
    // Mark current size as selected using aria-pressed
    b.setAttribute('aria-pressed', s.id===current.size ? 'true':'false');
    b.textContent = `${s.label} — $${s.price.toFixed(2)}`;
    b.addEventListener('click', ()=>{
      // Update selected size
      current.size = s.id;
      // Update visual state of all size buttons
      [...sr.children].forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      // Refresh combo info and pricing for new size
      updateComboInfo();
      updatePrice();
    });
    sr.appendChild(b);
  });

  // Display initial combo information for selected size
  updateComboInfo();

  // Render mix-in selection controls
  const mr = $('#mixRow'); mr.innerHTML = '';
  MIXES.forEach(m => {
    // Initialize quantity to 0 for each mix-in
    current.mixes[m.id] = 0;
    const card = document.createElement('div');
    card.className = 'top-card';
    card.innerHTML = `
      <div class="top-name">${m.name}</div>
      <div class="qty-control">
        <button type="button" class="qty-btn" data-act="dec" data-type="mix" data-id="${m.id}">-</button>
        <span id="mix-qty-${m.id}" class="qty-val">0</span>
        <button type="button" class="qty-btn" data-act="inc" data-type="mix" data-id="${m.id}">+</button>
      </div>
    `;
    mr.appendChild(card);
  });

  // Render topping selection controls
  const tr = $('#toppingsRow'); tr.innerHTML = '';
  TOPPINGS.forEach(t => {
    // Initialize quantity to 0 for each topping
    current.toppings[t.id] = 0;
    const card = document.createElement('div');
    card.className = 'top-card';
    card.innerHTML = `
      <div class="top-name">${t.name}</div>
      <div class="qty-control">
        <button type="button" class="qty-btn" data-act="dec" data-type="topping" data-id="${t.id}">-</button>
        <span id="topping-qty-${t.id}" class="qty-val">0</span>
        <button type="button" class="qty-btn" data-act="inc" data-type="topping" data-id="${t.id}">+</button>
      </div>
    `;
    tr.appendChild(card);
  });

  // Wire up main item quantity controls (+ / - buttons in footer)
  // These are separate from the topping/mix-in quantity controls
  $$('.qty-btn').forEach(b => {
    const type = b.dataset.type;
    if (type) return; // Skip topping/mix-in controls (handled by delegated listener below)
    const act = b.dataset.act;
    b.onclick = () => {
      let q = current.qty || 1;
      if (act === 'inc') q++;  // Increment quantity
      if (act === 'dec') q = Math.max(1, q - 1);  // Decrement but never below 1
      current.qty = q;
      $('#qtyVal').textContent = q;
      updatePrice();  // Recalculate total price
    };
  });

  // Wire up special notes textarea
  const notesEl = $('#notes');
  notesEl.value = '';
  notesEl.oninput = () => { current.notes = notesEl.value.trim(); };

  // Wire up "Add to Cart" button
  $('#addBtn').onclick = onAddToCart;

  // Show modal and prevent background scrolling
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  updatePrice();  // Calculate initial price

  // Set focus to modal panel for keyboard navigation
  const panel = modal.querySelector('.modal-panel');
  if (panel) panel.focus();
}

// Closes the customization modal and restores page scrolling
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

// Close modal when clicking on close button/overlay
modal.addEventListener('click', (e)=>{ if (e.target.matches('[data-close]')) closeModal(); });

// Close modal when pressing Escape key
document.addEventListener('keydown', (e)=>{ if (!modal.hidden && e.key==='Escape') closeModal(); });

// ========== PRICING CALCULATIONS ==========

// Returns count of toppings, mix-ins, and total items selected
function counts() {
  const toppingCount = Object.values(current.toppings).reduce((s,v)=>s+v,0);
  const mixCount     = Object.values(current.mixes).reduce((s,v)=>s+v,0);
  return { toppingCount, mixCount, total: toppingCount + mixCount };
}

// Calculates the unit price for one item based on size and extras
function calcUnit() {
  const size = SIZES.find(s => s.id === current.size);
  const basePrice = size ? size.price : 0;
  const limit = LIMITS[current.size]?.maxTotal ?? 0;

  const { total } = counts();
  // Calculate how many items exceed the included limit
  const extras = Math.max(0, total - limit);
  // Cap chargeable extras at MAX_EXTRAS (2)
  const chargeableExtras = Math.min(extras, MAX_EXTRAS);

  // Base price + (number of chargeable extras × extra item price)
  return +(basePrice + chargeableExtras * EXTRA_PRICE).toFixed(2);
}

// Updates the combo information display to show included options for selected size
function updateComboInfo() {
  const sizeLimits = LIMITS[current.size];
  const infoEl = $('#comboInfo');
  if (!sizeLimits || !infoEl) return;
  // Display example combinations and extra items policy
  infoEl.innerHTML = `
    <strong>Included Options:</strong><br>
    ${sizeLimits.description.map(d => `• ${d}`).join('<br>')}
    <br><em>+ Up to ${MAX_EXTRAS} extra item(s) allowed ($${EXTRA_PRICE.toFixed(2)} each)</em>
  `;
}

// Updates the total price display based on unit price × quantity
function updatePrice() {
  const unit = calcUnit();
  const total = unit * (current.qty || 1);
  $('#addPrice').textContent = `$${total.toFixed(2)}`;
}

// ========== ADD TO CART ==========

// Handles adding the customized item to the cart
function onAddToCart() {
  const { toppingCount, mixCount, total } = counts();
  const limit = LIMITS[current.size]?.maxTotal ?? 0;

  // Validate that total items don't exceed limit + max extras
  if (total > limit + MAX_EXTRAS) {
    alert(`For a ${current.size} cup, you can add at most ${limit} included items plus ${MAX_EXTRAS} extra (charged) items.`);
    return;
  }

  // Build descriptive label for cart item
  const sizeLabel = SIZES.find(s => s.id === current.size)?.label || '';
  
  // Format selected toppings with quantities
  const selT = Object.entries(current.toppings)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => `${TOPPINGS.find(t => t.id === id)?.name} x${qty}`);

  // Format selected mix-ins with quantities
  const selM = Object.entries(current.mixes)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => `${MIXES.find(m => m.id === id)?.name} x${qty}`);

  // Build complete label: base • size • toppings • mix-ins • notes
  let label = `${current.base.name} • ${sizeLabel}`;
  if (selT.length) label += ` • T: ${selT.join(', ')}`;
  if (selM.length) label += ` • M: ${selM.join(', ')}`;
  if (current.notes) label += ` • notes: ${current.notes}`;

  const unit = calcUnit();

  // Add to cart using global addToCart function if available
  if (typeof addToCart === 'function') {
    // Add the item 'qty' times to the cart
    for (let i = 0; i < current.qty; i++) addToCart('BYO', label, unit, current.size);
    alert('Added to cart!');
  } else {
    // Fallback demo mode if addToCart function doesn't exist
    alert(`(Demo) ${current.qty} × ${label} — $${(unit * current.qty).toFixed(2)}`);
  }
  closeModal();
}

// ========== CART MODAL INTEGRATION ==========

// Wires up the cart button on the Build page to open the cart modal
function wireCartOnBuild() {
  const btn   = document.getElementById('cartBtn');
  const modal = document.getElementById('cartModal');
  const close = document.getElementById('closeCart');
  if (!btn || !modal) return;

  // Open cart modal when cart button is clicked
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Use global openCart function if available, otherwise handle locally
    if (typeof window.openCart === 'function') { window.openCart(); return; }
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  // Helper to close cart modal
  const closeModal = () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Close button handler
  if (close) close.addEventListener('click', closeModal);

  // Close when clicking outside modal content
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  // Close with Escape key
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display === 'block') closeModal(); });
}

// ========== INITIALIZATION ==========

// Initialize page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  wireCartOnBuild();      // Set up cart button functionality
  renderFlavorGrid();     // Render the flavor selection grid
});

// ========== EVENT DELEGATION FOR TOPPING/MIX-IN QUANTITIES ==========

// Global click handler for topping and mix-in quantity buttons (+ / -)
// Uses event delegation for better performance with many buttons
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn');
  // Only handle topping/mix-in quantity buttons (have type data attribute)
  if (!btn || !btn.dataset.type || !btn.dataset.id) return;

  const type = btn.dataset.type; // "topping" or "mix"
  const id = btn.dataset.id;
  const action = btn.dataset.act; // "inc" or "dec"

  // Get the appropriate bucket (toppings or mixes)
  const bucket = (type === 'topping') ? current.toppings : current.mixes;
  const oldQty = bucket[id] || 0;
  // Calculate new quantity: increment or decrement (min 0)
  const newQty = action === 'inc' ? oldQty + 1 : Math.max(0, oldQty - 1);

  // Create temporary state to check if new total would exceed limits
  const tempT = { ...current.toppings, ...(type==='topping' ? { [id]: newQty } : {}) };
  const tempM = { ...current.mixes,    ...(type==='mix'     ? { [id]: newQty } : {}) };

  const totalItems =
    Object.values(tempT).reduce((s,v)=>s+v,0) +
    Object.values(tempM).reduce((s,v)=>s+v,0);

  const limit = LIMITS[current.size]?.maxTotal ?? 0;

  // Validate that total doesn't exceed included limit + max extras
  if (totalItems > limit + MAX_EXTRAS) {
    alert(`You can add at most ${limit} included items plus ${MAX_EXTRAS} extra (charged) items for a ${current.size} cup.`);
    return;
  }

  // Update is valid - commit the change to state
  bucket[id] = newQty;
  // Update the display for this specific item
  const displayEl = document.getElementById(`${type}-qty-${id}`);
  if (displayEl) displayEl.textContent = newQty;
  // Recalculate total price
  updatePrice();
});