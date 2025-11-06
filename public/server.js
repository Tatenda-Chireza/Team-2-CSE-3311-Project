// Load environment variables from .env file (contains sensitive keys like Stripe secret)
require('dotenv').config();  // Load environment variables from .env

// Import required dependencies
const express = require('express');
// Initialize Stripe with secret key from environment variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Load secret from .env
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create Express application instance
const app = express();

// Enable CORS (Cross-Origin Resource Sharing) for all routes
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// Serve static files from the project root directory
app.use(express.static('.'));

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
   ========================================= */
// POST endpoint to handle catering booking requests
app.post('/api/catering', (req, res) => {
  // Destructure catering form data from request body
  const { name, email, date, guests, notes, createdAt } = req.body || {};

  // basic validation
  // Validate that all required fields are present
  if (!name || !email || !date || !guests) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }

  // Create a structured record object with sanitized data
  const record = {
    name: String(name).trim(), // Convert to string and remove whitespace
    email: String(email).trim(),
    date: String(date),
    guests: Number(guests), // Convert to number
    notes: (notes ? String(notes) : '').trim(), // Optional field, default to empty string
    createdAt: createdAt || new Date().toISOString(), // Use provided timestamp or create new one
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
    // Return success response to client
    return res.json({ ok: true });
  } catch (e) {
    // Log any file system errors
    console.error('Failed to write catering request:', e);
    // Return error response to client
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// Define the port number for the server
const PORT = 3000;
// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  // Log server startup messages to console
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Open http://localhost:3000/index.html in your browser');
});