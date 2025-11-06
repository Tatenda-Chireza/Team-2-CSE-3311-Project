// server.js — static server + Stripe Checkout + catering (robust writes)

try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises; // for async/atomic writes

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ================================
   Stripe: Create Checkout Session
   ================================ */
app.post('/create-checkout-session', async (req, res) => {
  const host = req.headers.origin || `http://localhost:${process.env.PORT || 3000}`;
  const successURL = req.body?.success_url || `${host}/success.html`;
  const cancelURL  = req.body?.cancel_url  || `${host}/checkout.html`;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({
      error: 'Stripe not configured on server',
      hint: 'Set STRIPE_SECRET_KEY in .env (sk_test_...) and restart.'
    });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  try {
    // Support both { line_items } and { items: [{name, price, quantity}] }
    let line_items = req.body?.line_items;

    if (!line_items && Array.isArray(req.body?.items)) {
      line_items = req.body.items.map(i => {
        const dollars = Number(i.price || 0);
        const quantity = Math.max(1, Number(i.quantity || 1));
        return {
          quantity,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(dollars * 100),
            product_data: { name: String(i.name || 'Item') }
          }
        };
      });
    }

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'No line_items or items provided.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: successURL,
      cancel_url:  cancelURL
    });

    return res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Stripe session creation failed.' });
  }
});

/* =========================================
   Catering: Collect booking form submissions
   ========================================= */

// Absolute, single source of truth for the JSON file
const DATA_PATH = path.resolve(__dirname, 'catering-requests.json');

// helper: load current array (fail-soft)
async function readRequests() {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = await fsp.readFile(DATA_PATH, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('⚠️ catering read/parse error -> starting fresh:', e.message);
    return [];
  }
}

// helper: atomic-ish write
async function writeRequests(arr) {
  const tmp = DATA_PATH + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(arr, null, 2), 'utf8');
  await fsp.rename(tmp, DATA_PATH);
}

app.post('/api/catering', async (req, res) => {
  try {
    const { name, email, date, guests, notes, createdAt } = req.body || {};
    if (!name || !email || !date || !Number(guests)) {
      return res.status(400).json({ ok: false, error: 'Missing required fields.' });
    }

    const record = {
      name: String(name).trim(),
      email: String(email).trim(),
      date: String(date),
      guests: Number(guests),
      notes: (notes ? String(notes) : '').trim(),
      createdAt: createdAt || new Date().toISOString()
    };

    const list = await readRequests();
    list.push(record);
    await writeRequests(list);

    console.log('✅ Saved catering entry:', record);
    console.log('➡️  File updated at:', DATA_PATH);
    return res.status(201).json({ ok: true, saved: record });
  } catch (e) {
    console.error('❌ Failed to write catering request:', e);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// Optional: quick endpoint to inspect what the server wrote
app.get('/api/catering', async (_req, res) => {
  const data = await readRequests();
  res.json({ count: data.length, data });
});

// ✅ Express v5-safe catch-all: use '/*' (NOT '*')
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`🔎 Health check:  http://localhost:${PORT}/health`);
  console.log('🗂  Catering JSON path:', DATA_PATH);
});
