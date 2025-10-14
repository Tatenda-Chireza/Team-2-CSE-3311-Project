require('dotenv').config();  // Load environment variables from .env
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Load secret from .env
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { line_items } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/checkout.html',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Open http://localhost:3000/index.html in your browser');
});
