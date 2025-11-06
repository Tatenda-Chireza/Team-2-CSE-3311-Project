// server.js — static server + Stripe Checkout + catering (Express v5 safe)

try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
    let line_items = req.body?.line_items;

    // Allow shorthand items format
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
      cancel_url: cancelURL
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
app.post('/api/catering', (req, res) => {
  const { name, email, date, guests, notes, createdAt } = req.body || {};
  if (!name || !email || !date || !guests) {
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

  const file = path.join(__dirname, 'catering-requests.json');

  try {
    let existing = [];
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      existing = raw ? JSON.parse(raw) : [];
    }
    existing.push(record);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write catering request:', e);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// ✅ Express v5-safe catch-all (regex instead of '*')
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`🔎 Health check:  http://localhost:${PORT}/health`);
});
