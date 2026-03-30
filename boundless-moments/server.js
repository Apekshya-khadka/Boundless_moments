const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./routes/db');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------
// CONTACT FORM
// -----------------------------
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );
    res.redirect('/contact.html?success=true');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving message');
  }
});

// -----------------------------
// ADMIN LOGIN
// -----------------------------
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) return res.send('User not found');
    const user = result.rows[0];

    if (user.password === password) {
      // Login success → redirect to dashboard
      res.redirect('/admin-dashboard.html');
    } else {
      res.send('Invalid password');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Login error');
  }
});

// -----------------------------
// LOGOUT
// -----------------------------
app.get('/admin/logout', (req, res) => {
  res.redirect('/admin.html');
});

// -----------------------------
// GET MESSAGES (ADMIN)
// -----------------------------
app.get('/admin/messages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading messages');
  }
});

// -----------------------------
// PORTFOLIO ROUTES
// -----------------------------
app.get('/admin/portfolio', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM portfolio ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading portfolio');
  }
});

app.post('/admin/portfolio', async (req, res) => {
  const { title, description, image_url } = req.body;
  try {
    await pool.query(
      'INSERT INTO portfolio (title, description, image_url) VALUES ($1, $2, $3)',
      [title, description, image_url]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding portfolio item');
  }
});

app.delete('/admin/portfolio/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM portfolio WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting portfolio item');
  }
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});