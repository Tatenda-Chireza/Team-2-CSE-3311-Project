// Load environment variables from .env file (contains sensitive keys like Stripe secret & SMTP config)
require('dotenv').config();

// Import required dependencies
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Load Stripe secret from .env
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // For sending emails

// Create Express application instance
const app = express();

// Enable CORS (Cross-Origin Resource Sharing) for all routes
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// Serve static files from the project root directory
app.use(express.static('.'));

/* =========================
   Email configuration
   ========================= */

// Configure nodemailer SMTP transport using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587, etc.
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Main store email (for receiving notifications)
const STORE_EMAIL = process.env.STORE_EMAIL || process.env.SMTP_USER;

// Helper: safely send email without crashing the server
async function safeSendMail(options) {
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.error('Email send error:', err);
  }
}

/* ================================
   Stripe: Create Checkout Session
   ================================ */

// POST endpoint to create a new Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    // Extract line items (products/services) from request body
    const { line_items } = req.body;

    // Create a new Stripe checkout session with the provided configuration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Accept card payments only
      line_items, // Products/services to be purchased
      mode: 'payment', // One-time payment (not subscription)
      success_url: 'http://localhost:3000/success.html', // Redirect here on successful payment
      cancel_url: 'http://localhost:3000/checkout.html', // Redirect here if user cancels
    });

    // Return the session ID to the client
    res.json({ id: session.id });
  } catch (error) {
    // Log any errors and return error message to client
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================================
   Catering: Collect booking form submissions
   + send confirmation emails
   ========================================= */

app.post('/api/catering', async (req, res) => {
  // Destructure catering form data from request body
  const { name, email, date, guests, notes, createdAt } = req.body || {};

  // Validate that all required fields are present
  if (!name || !email || !date || !guests) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }

  // Create a structured record object with sanitized data
  const record = {
    name: String(name).trim(),
    email: String(email).trim(),
    date: String(date),
    guests: Number(guests),
    notes: (notes ? String(notes) : '').trim(),
    createdAt: createdAt || new Date().toISOString(),
  };

  // Define the path to the JSON file where catering requests are stored
  const file = path.join(__dirname, 'catering-requests.json');

  try {
    // Initialize array to hold existing catering requests
    let existing = [];
    // Check if the catering requests file already exists
    if (fs.existsSync(file)) {
      // Read the existing file content
      const raw = fs.readFileSync(file, 'utf8');
      // Parse JSON content, or use empty array if file is empty
      existing = raw ? JSON.parse(raw) : [];
    }

    // Add the new catering request to the array
    existing.push(record);
    // Write the updated array back to the file with pretty formatting
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));

    // ========== EMAILS ==========

    // 1) Confirmation email to customer
    await safeSendMail({
      from: `"Iceland Ice Cream" <${STORE_EMAIL}>`,
      to: record.email,
      subject: 'We received your catering request 🍦',
      html: `
        <p>Hi ${record.name},</p>
        <p>Thank you for reaching out to <strong>Iceland Ice Cream</strong> for your event.</p>
        <p>Here are the details we received:</p>
        <ul>
          <li><strong>Date:</strong> ${record.date}</li>
          <li><strong>Guests:</strong> ${record.guests}</li>
          <li><strong>Notes:</strong> ${record.notes || 'None provided'}</li>
        </ul>
        <p>We’ll review your request and contact you soon with pricing and availability.</p>
        <p>Best,<br>Iceland Ice Cream</p>
      `,
    });

    // 2) Notification email to store
    await safeSendMail({
      from: `"Iceland Ice Cream Website" <${STORE_EMAIL}>`,
      to: STORE_EMAIL,
      subject: `New catering request from ${record.name} (${record.guests} guests)`,
      html: `
        <p>New catering request received:</p>
        <ul>
          <li><strong>Name:</strong> ${record.name}</li>
          <li><strong>Email:</strong> ${record.email}</li>
          <li><strong>Date:</strong> ${record.date}</li>
          <li><strong>Guests:</strong> ${record.guests}</li>
          <li><strong>Notes:</strong> ${record.notes || 'None'}</li>
          <li><strong>Submitted at:</strong> ${record.createdAt}</li>
        </ul>
      `,
    });

    // Return success response to client
    return res.json({ ok: true });
  } catch (e) {
    // Log any file system or email errors
    console.error('Failed to write catering request or send emails:', e);
    // Return error response to client
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

/* =========================================
   Orders: Save orders + send confirmation
   ========================================= */

app.post('/api/order', async (req, res) => {
  const { name, email, items, total, createdAt } = req.body || {};

  // Basic payload validation
  if (!name || !email || !Array.isArray(items) || typeof total !== 'number') {
    return res.status(400).json({ ok: false, error: 'Invalid order payload.' });
  }

  // Normalize the order structure
  const order = {
    name: String(name).trim(),
    email: String(email).trim(),
    items: items.map((it) => ({
      name: String(it.name),
      qty: Number(it.qty || 0),
      unitPrice: Number(it.unitPrice || 0),
      lineTotal: Number(it.lineTotal || 0),
    })),
    total: Number(total),
    createdAt: createdAt || new Date().toISOString(),
  };

  const file = path.join(__dirname, 'orders.json');

  try {
    // Load existing orders if file exists
    let existing = [];
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      existing = raw ? JSON.parse(raw) : [];
    }

    // Append new order
    existing.push(order);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));

    // Format items for email
    const linesHtml =
      order.items
        .map(
          (it) =>
            `<li>${it.qty} × ${it.name} — $${it.lineTotal.toFixed(2)}</li>`
        )
        .join('') || '<li>No items listed</li>';

    // 1) Confirmation email to customer
    await safeSendMail({
      from: `"Iceland Ice Cream" <${STORE_EMAIL}>`,
      to: order.email,
      subject: 'Your Iceland Ice Cream order confirmation 🍦',
      html: `
        <p>Hi ${order.name},</p>
        <p>Thank you for your order from <strong>Iceland Ice Cream</strong>!</p>
        <p>Order summary:</p>
        <ul>
          ${linesHtml}
        </ul>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p>We’ll start preparing your ice cream shortly.</p>
        <p>Best,<br>Iceland Ice Cream</p>
      `,
    });

    // 2) Notification email to store
    await safeSendMail({
      from: `"Iceland Ice Cream Website" <${STORE_EMAIL}>`,
      to: STORE_EMAIL,
      subject: `New order from ${order.name} — $${order.total.toFixed(2)}`,
      html: `
        <p>New order placed on the website:</p>
        <ul>
          <li><strong>Name:</strong> ${order.name}</li>
          <li><strong>Email:</strong> ${order.email}</li>
          <li><strong>Total:</strong> $${order.total.toFixed(2)}</li>
          <li><strong>Created at:</strong> ${order.createdAt}</li>
        </ul>
        <p>Items:</p>
        <ul>
          ${linesHtml}
        </ul>
      `,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write order or send emails:', e);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// Define the port number for the server
const PORT = 3000;

// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Open http://localhost:3000/index.html in your browser');
});
