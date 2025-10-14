// build.js — BYO grid + modal (no container option)
// Sizes: Small $5.25, Regular $7.25
// Pricing: ^ + each extra topping/mix +$0.50

const BASE_FLAVORS = [
  { id:'original',  name:'Original (Vanilla)',       img:'img/original.jpeg',  desc:'Classic vanilla base. Calories: 415' },
  { id:'df-vanilla',name:'Dairy Free (Vanilla)',     img:'img/dairyfree.jpeg',  desc:'Dairy-free vanilla (Almond Milk). Calories: 250' },
  { id:'chocolate', name:'Chocolate',                img:'img/chocolate.jpeg',  desc:'Rich chocolate. Calories: 450' },
  { id:'mango',     name:'Mango',                    img:'img/mango.jpeg',  desc:'Tropical mango. Calories: 300' },
  { id:'green-tea', name:'Green Tea',                img:'img/greentea.jpeg',  desc:'Matcha-style. Calories: 315' },
  { id:'thai-tea',  name:'Thai Tea',                 img:'img/thaitea.jpeg',  desc:'Spiced tea flavor. Calories: 350' },
  { id:'taro',      name:'Taro',                     img:'img/taro.jpeg',  desc:'Creamy taro. Calories: 420' },
  { id:'milk-tea',  name:'Milk Tea',                 img:'img/milktea.jpeg',  desc:'Milk tea base. Calories: 300' },
  { id:'coffee',    name:'Coffee',                   img:'img/coffee.jpeg',  desc:'Coffee kick. Calories: 415' }
];

const SIZES = [
  { id:'small',   label:'Small',   price:5.25 },
  { id:'regular', label:'Regular', price:7.25 }
];

const TOPPINGS = [
  'Almonds','Banana','Blackberry','Blueberry','Brownie','Caramel Sauce',
  'Cherry','Cheesecake Bites','Chocolate Chips','Chocolate Sauce','Coconut Shreds',
  'Condensed Milk','Cookie Dough','Ferrero','Fruit Loops','Fruity Pebbles','Gummy Bear',
  'Graham','Longan','Lychee','M&M\'s','Marshmallow','Mochi','Nutella','Oreo',
  'Panda Cookies','Cookies & Cream Pocky','Chocolate Pocky','Strawberry Pocky',
  'Peach','Pecan','Pineapple','Raspberry','Pretzels','Reese\'s','Sour Punch',
  'Sprinkles','Strawberry','Wafer','Whip Cream','White Chocolate Sauce'
].map(n => ({ id: n.toLowerCase().replace(/\s+/g,'-'), name: n }));

const MIXES = [
  'Banana','Blackberry','Blueberry','Brownie','Cheesecake','Coconut','Condensed Milk',
  'Fruity Pebbles','Graham','Lychee','Nutella','Oreo','Peach','Pineapple','Raspberry',
  'Sprinkles','Strawberry','Chocolate Sauce'
].map(n => ({ id: n.toLowerCase().replace(/\s+/g,'-'), name: n }));

const LIMITS = {
  small: {
    maxTotal: 3,
    validCombos: [
      { toppings: 2, mixes: 1 },
      { toppings: 1, mixes: 2 },
      { toppings: 2, mixes: 0 },
    ],
    description: [
      "1 Mix-in + 2 Toppings",
      "2 Mix-ins + 1 Topping",
      "0 Mix-ins + 2 Toppings"
    ]
  },
  regular: {
    maxTotal: 4,
    validCombos: [
      { toppings: 3, mixes: 1 },
      { toppings: 2, mixes: 2 },
      { toppings: 3, mixes: 0 },
    ],
    description: [
      "1 Mix-in + 3 Toppings",
      "2 Mix-ins + 2 Toppings",
      "0 Mix-ins + 3 Toppings"
    ]
  }
};



const $  = (q)=>document.querySelector(q);
const $$ = (q)=>Array.from(document.querySelectorAll(q));
const modal = $('#byoModal');

let current = {
  base: null,     // {id,name,desc,img}
  size: 'regular',
  toppings: {},   // ids
  mixes: {},      // ids
  qty: 1,
  notes: ''
};

// ---------- GRID ----------
function renderFlavorGrid()
{
  const grid = $('#flavorGrid');
  grid.innerHTML = '';
  BASE_FLAVORS.forEach(f =>
  {
    const card = document.createElement('button');
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

// ---------- MODAL ----------
function openModal(base)
{
  current.base = base;
  current.size = 'regular';
  current.toppings = [];
  current.mixes = [];
  current.qty = 1;
  current.notes = '';

  // header
  $('#mImg').src = base.img;
  $('#mImg').alt = base.name;
  $('#modalTitle').textContent = base.name;
  $('#mDesc').textContent = base.desc;
  $('#qtyVal').textContent = '1';

  // sizes
  const sr = $('#sizeRow'); sr.innerHTML = '';
  SIZES.forEach(s =>
  {
    const b = document.createElement('button');
    b.type='button'; b.className='opt-btn';
    b.setAttribute('aria-pressed', s.id===current.size ? 'true':'false');
    b.textContent = `${s.label} — $${s.price.toFixed(2)}`;
    b.addEventListener('click', ()=>{
      current.size = s.id;
      [...sr.children].forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      updatePrice();
      updateComboInfo();
    });
    
    sr.appendChild(b);
  });

  updateComboInfo();

  // mixes
  const mr = $('#mixRow'); mr.innerHTML = '';
  MIXES.forEach(m => {
  current.mixes[m.id] = 0; // initialize
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

// toppings
  const tr = $('#toppingsRow'); tr.innerHTML = '';
  TOPPINGS.forEach(t => {
  current.toppings[t.id] = 0; // initialize
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

// Handle main item quantity (+ / -)
$$('.qty-btn').forEach(b => {
  const type = b.dataset.type;
  const id = b.dataset.id;
  const act = b.dataset.act;

  // Skip if it's a mix or topping (they are handled by global listener)
  if (type && id) return;

  b.onclick = () => {
    let q = current.qty || 1;
    if (act === 'inc') q++;
    if (act === 'dec') q = Math.max(1, q - 1);
    current.qty = q;
    $('#qtyVal').textContent = q;
    updatePrice();
  };
});

  // notes
  const notesEl = $('#notes');
  notesEl.value = '';
  notesEl.oninput = () => { current.notes = notesEl.value.trim(); };

  // add
  $('#addBtn').onclick = onAddToCart;

  // show
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  updatePrice();

  /* Focus the panel so keyboard scroll (PgUp/PgDn/Space) works */
  const panel = modal.querySelector('.modal-panel');
  if (panel) panel.focus();
}

function closeModal()
{
  modal.hidden = true;
  document.body.style.overflow = '';
}
modal.addEventListener('click', (e)=>{ if (e.target.matches('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e)=>{ if (!modal.hidden && e.key==='Escape') closeModal(); });

// ---------- PRICING ----------
function calcUnit() {
  const size = SIZES.find(s => s.id === current.size);
  const basePrice = size ? size.price : 0;

  const toppingCount = Object.values(current.toppings).reduce((sum, val) => sum + val, 0);
  const mixCount = Object.values(current.mixes).reduce((sum, val) => sum + val, 0);

  const sizeLimits = LIMITS[current.size];
  const totalItems = toppingCount + mixCount;

  // Find best matching valid combo
  const matchingCombo = sizeLimits.validCombos.find(c =>
    toppingCount >= c.toppings && mixCount >= c.mixes
  );

  const baseAllowedTotal = sizeLimits.maxTotal;
  const extras = Math.max(0, totalItems - baseAllowedTotal);

  // Only allow up to 2 extras max
  const chargeableExtras = Math.min(extras, 2);
  const surcharge = chargeableExtras * 0.50;

  return +(basePrice + surcharge).toFixed(2);
}

// To change mix + topping combination based on size
function updateComboInfo() {
  const sizeLimits = LIMITS[current.size];
  const infoEl = $('#comboInfo');
  if (!sizeLimits || !infoEl) return;

  infoEl.innerHTML = `
    <strong>Included Options:</strong><br>
    ${sizeLimits.description.map(d => `• ${d}`).join('<br>')}
    <br><em>+ Up to 2 extra items allowed ($0.50 each)</em>
  `;
}

function updatePrice()
{
  const unit = calcUnit();
  const total = unit * (current.qty || 1);
  $('#addPrice').textContent = `$${total.toFixed(2)}`;
}



// ---------- ADD TO CART ----------
function onAddToCart() {
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
    for (let i = 0; i < current.qty; i++)
      addToCart('BYO', label, unit, current.size);
    alert('Added to cart!');
  } else {
    alert(`(Demo) ${current.qty} × ${label} — $${(unit * current.qty).toFixed(2)}`);
  }

  closeModal();
}


/* ===== Make the Cart button work on the Build page ===== */
function wireCartOnBuild()
{
  const btn   = document.getElementById('cartBtn');
  const modal = document.getElementById('cartModal');
  const close = document.getElementById('closeCart');

  if (!btn || !modal) return;

  // Open
  btn.addEventListener('click', (e) =>
  {
    e.preventDefault();
    // If menu.js exposes openCart, prefer it
    if (typeof window.openCart === 'function') {
      window.openCart();
      return;
    }
    // Fallback open (works even without menu.js helpers)
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  // Close by X or clicking outside panel
  const closeModal = () =>
  {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (close) {
    close.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) =>
  {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Optional: ESC to close
  document.addEventListener('keydown', (e) =>
  {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
}

// Run on page load (in addition to your existing init)
document.addEventListener('DOMContentLoaded', wireCartOnBuild);

// Handles + / - for toppings and mix-ins with limit enforcement
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn');
  if (!btn || !btn.dataset.type || !btn.dataset.id) return;

  const type = btn.dataset.type; // "topping" or "mix"
  const id = btn.dataset.id;
  const action = btn.dataset.act;

  const itemList = (type === 'topping') ? current.toppings : current.mixes;
  let qty = itemList[id] || 0;
  const newQty = (action === 'inc') ? qty + 1 : Math.max(0, qty - 1);

  const newToppingCount = Object.entries(current.toppings)
    .reduce((sum, [k, val]) => sum + (k === id && type === 'topping' ? newQty : val), 0);

  const newMixCount = Object.entries(current.mixes)
    .reduce((sum, [k, val]) => sum + (k === id && type === 'mix' ? newQty : val), 0);

  const totalItems = newToppingCount + newMixCount;
  const sizeLimits = LIMITS[current.size];

  const isWithinValidCombo = sizeLimits.validCombos.some(combo =>
    newToppingCount <= combo.toppings &&
    newMixCount <= combo.mixes &&
    totalItems <= sizeLimits.maxTotal
  );

  const extraItems = Math.max(0, totalItems - sizeLimits.maxTotal);

  if (!isWithinValidCombo && extraItems > 2) {
    alert(`For a ${current.size} cup, you may choose up to 2 extra items beyond the normal limit (extra items are $0.50 each).`);
    return;
  }

  // Accept and update quantity
  itemList[id] = newQty;
  const displayEl = document.getElementById(`${type}-qty-${id}`);
  if (displayEl) displayEl.textContent = newQty;

  updatePrice();
});


// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', renderFlavorGrid);
