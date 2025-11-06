// build.js — BYO grid + modal
// Sizes: Small $5.25, Regular $7.25
// Pricing: included up to LIMITS[size].maxTotal; up to 2 extras cost $0.50 each

// ========== DATA DEFINITIONS ==========

// Array of base flavor options with metadata (id, name, image path, description with calories)
const BASE_FLAVORS = [
  { id:'original',  name:'Original (Vanilla)',   img:'img/original.jpeg',   desc:'Classic vanilla base. Calories: 415' },
  { id:'df-vanilla',name:'Dairy Free (Vanilla)', img:'img/dairyfree.jpeg',  desc:'Dairy-free vanilla (Almond Milk). Calories: 250' },
  { id:'chocolate', name:'Chocolate',            img:'img/chocolate.jpeg',  desc:'Rich chocolate. Calories: 450' },
  { id:'mango',     name:'Mango',                img:'img/mango.jpeg',      desc:'Tropical mango. Calories: 300' },
  { id:'green-tea', name:'Green Tea',            img:'img/greentea.jpeg',   desc:'Matcha-style. Calories: 315' },
  { id:'thai-tea',  name:'Thai Tea',             img:'img/thaitea.jpeg',    desc:'Spiced tea flavor. Calories: 350' },
  { id:'taro',      name:'Taro',                 img:'img/taro.jpeg',       desc:'Creamy taro. Calories: 420' },
  { id:'milk-tea',  name:'Milk Tea',             img:'img/milktea.jpeg',    desc:'Milk tea base. Calories: 300' },
  { id:'coffee',    name:'Coffee',               img:'img/coffee.jpeg',     desc:'Coffee kick. Calories: 415' }
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
  small: { maxTotal: 3, description: ["1 Mix-in + 2 Toppings","2 Mix-ins + 1 Topping","0 Mix-ins + 2 Toppings"] },
  regular: { maxTotal: 4, description: ["1 Mix-in + 3 Toppings","2 Mix-ins + 2 Toppings","0 Mix-ins + 3 Toppings"] }
};

// Extra item pricing constants
const EXTRA_PRICE = 0.50;  // Cost per extra item beyond included limit
const MAX_EXTRAS  = 2;     // Maximum number of extra items allowed

// ========== UTILITY FUNCTIONS ==========

const $  = (q)=>document.querySelector(q);
const $$ = (q)=>Array.from(document.querySelectorAll(q));

// Reference to the modal element
const modal = $('#byoModal');

// ========== STATE MANAGEMENT ==========
let current = {
  base: null,
  size: 'regular',
  toppings: {},
  mixes: {},
  qty: 1,
  notes: ''
};

// ========== GRID RENDERING ==========
function renderFlavorGrid() {
  const grid = $('#flavorGrid');
  grid.innerHTML = '';
  BASE_FLAVORS.forEach(f => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'flavor-card';
    card.innerHTML = `
      <img src="${f.img}" alt="${f.name}">
      <div class="flavor-name">${f.name}</div>
      <div class="flavor-meta">Choose to customize</div>
    `;
    card.addEventListener('click', ()=> openModal(f));
    grid.appendChild(card);
  });
}

// ========== MODAL OPERATIONS ==========
function openModal(base) {
  current.base = base;
  current.size = 'regular';
  current.toppings = {};
  current.mixes = {};
  current.qty = 1;
  current.notes = '';

  $('#mImg').src = base.img;
  $('#mImg').alt = base.name;
  $('#modalTitle').textContent = base.name;
  $('#mDesc').textContent = base.desc;
  $('#qtyVal').textContent = '1';

  const sr = $('#sizeRow'); sr.innerHTML = '';
  SIZES.forEach(s => {
    const b = document.createElement('button');
    b.type='button';
    b.className='opt-btn';
    b.setAttribute('aria-pressed', s.id===current.size ? 'true':'false');
    b.textContent = `${s.label} — $${s.price.toFixed(2)}`;
    b.addEventListener('click', ()=>{
      current.size = s.id;
      [...sr.children].forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      updateComboInfo();
      updatePrice();
    });
    sr.appendChild(b);
  });

  updateComboInfo();

  const mr = $('#mixRow'); mr.innerHTML = '';
  MIXES.forEach(m => {
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

  const tr = $('#toppingsRow'); tr.innerHTML = '';
  TOPPINGS.forEach(t => {
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

  $$('.qty-btn').forEach(b => {
    const type = b.dataset.type;
    if (type) return;
    const act = b.dataset.act;
    b.onclick = () => {
      let q = current.qty || 1;
      if (act === 'inc') q++;
      if (act === 'dec') q = Math.max(1, q - 1);
      current.qty = q;
      $('#qtyVal').textContent = q;
      updatePrice();
    };
  });

  const notesEl = $('#notes');
  notesEl.value = '';
  notesEl.oninput = () => { current.notes = notesEl.value.trim(); };

  $('#addBtn').onclick = onAddToCart;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  updatePrice();

  const panel = modal.querySelector('.modal-panel');
  if (panel) panel.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

modal.addEventListener('click', (e)=>{ if (e.target.matches('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e)=>{ if (!modal.hidden && e.key==='Escape') closeModal(); });

// ========== PRICING CALCULATIONS ==========
function counts() {
  const toppingCount = Object.values(current.toppings).reduce((s,v)=>s+v,0);
  const mixCount     = Object.values(current.mixes).reduce((s,v)=>s+v,0);
  return { toppingCount, mixCount, total: toppingCount + mixCount };
}

function calcUnit() {
  const size = SIZES.find(s => s.id === current.size);
  const basePrice = size ? size.price : 0;
  const limit = LIMITS[current.size]?.maxTotal ?? 0;

  const { total } = counts();
  const extras = Math.max(0, total - limit);
  const chargeableExtras = Math.min(extras, MAX_EXTRAS);
  return +(basePrice + chargeableExtras * EXTRA_PRICE).toFixed(2);
}

function updateComboInfo() {
  const sizeLimits = LIMITS[current.size];
  const infoEl = $('#comboInfo');
  if (!sizeLimits || !infoEl) return;
  infoEl.innerHTML = `
    <strong>Included Options:</strong><br>
    ${sizeLimits.description.map(d => `• ${d}`).join('<br>')}
    <br><em>+ Up to ${MAX_EXTRAS} extra item(s) allowed ($${EXTRA_PRICE.toFixed(2)} each)</em>
  `;
}

function updatePrice() {
  const unit = calcUnit();
  const total = unit * (current.qty || 1);
  $('#addPrice').textContent = `$${total.toFixed(2)}`;
}

// ========== ADD TO CART ==========
function onAddToCart() {
  const { total } = counts();
  const limit = LIMITS[current.size]?.maxTotal ?? 0;

  if (total > limit + MAX_EXTRAS) {
    alert(`For a ${current.size} cup, you can add at most ${limit} included items plus ${MAX_EXTRAS} extra (charged) items.`);
    return;
  }

  const sizeLabel = SIZES.find(s => s.id === current.size)?.label || '';
  const selT = Object.entries(current.toppings)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => `${TOPPINGS.find(t => t.id === id)?.name} x${qty}`);
  const selM = Object.entries(current.mixes)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => `${MIXES.find(m => m.id === id)?.name} x${qty}`);

  let label = `${current.base.name} • ${sizeLabel}`;
  if (selT.length) label += ` • T: ${selT.join(', ')}`;
  if (selM.length) label += ` • M: ${selM.join(', ')}`;
  if (current.notes) label += ` • notes: ${current.notes}`;

  const unit = calcUnit();

  if (typeof addToCart === 'function') {
    for (let i = 0; i < current.qty; i++) addToCart('BYO', label, unit, current.size);
    alert('Added to cart!');
  } else {
    alert(`(Demo) ${current.qty} × ${label} — $${(unit * current.qty).toFixed(2)}`);
  }
  closeModal();
}

// ========== CART MODAL INTEGRATION ==========
function wireCartOnBuild() {
  const btn   = document.getElementById('cartBtn');
  const modal = document.getElementById('cartModal');
  const close = document.getElementById('closeCart');
  if (!btn || !modal) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.openCart === 'function') { window.openCart(); return; }
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (close) close.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display === 'block') closeModal(); });
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  wireCartOnBuild();
  renderFlavorGrid();
});

// ========== EVENT DELEGATION FOR TOPPING/MIX-IN QUANTITIES ==========
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn');
  if (!btn || !btn.dataset.type || !btn.dataset.id) return;

  const type = btn.dataset.type;
  const id = btn.dataset.id;
  const action = btn.dataset.act;

  const bucket = (type === 'topping') ? current.toppings : current.mixes;
  const oldQty = bucket[id] || 0;
  const newQty = action === 'inc' ? oldQty + 1 : Math.max(0, oldQty - 1);

  const tempT = { ...current.toppings, ...(type==='topping' ? { [id]: newQty } : {}) };
  const tempM = { ...current.mixes,    ...(type==='mix'     ? { [id]: newQty } : {}) };

  const totalItems =
    Object.values(tempT).reduce((s,v)=>s+v,0) +
    Object.values(tempM).reduce((s,v)=>s+v,0);

  const limit = LIMITS[current.size]?.maxTotal ?? 0;

  if (totalItems > limit + MAX_EXTRAS) {
    alert(`You can add at most ${limit} included items plus ${MAX_EXTRAS} extra (charged) items for a ${current.size} cup.`);
    return;
  }

  bucket[id] = newQty;
  const displayEl = document.getElementById(`${type}-qty-${id}`);
  if (displayEl) displayEl.textContent = newQty;
  updatePrice();
});
