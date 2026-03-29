const express = require('express');
const session = require('express-session');
const path = require('path');
const pool = require('../routes/db.js'); // database connection

const app = express();
const port = 3000;

// ------------------------
// Middleware
// ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from ./public (inside boundless-moments)
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------
// Session
// ------------------------
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// ------------------------
// ROOT ROUTE
// ------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------------------
// LOGIN ROUTE
// ------------------------
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', username, password);

    if (!username || !password) {
        return res.status(400).send('Username and password required');
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        console.log('DB result:', result.rows);

        if (result.rows.length > 0) {
            req.session.admin = true;
            req.session.username = username;
            res.redirect('/admin/dashboard');
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// ------------------------
// DASHBOARD
// ------------------------
app.get('/admin/dashboard', (req, res) => {
    if (req.session.admin) {
        res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
    } else {
        res.redirect('/admin.html');
    }
});

// ------------------------
// LOGOUT
// ------------------------
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin.html');
    });
});

// ------------------------
// CONTACT FORM ROUTE
// ------------------------
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('All fields are required');
    }

    try {
        await pool.query(
            'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)',
            [name, email, message]
        );
        res.send('Message received successfully!');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// ------------------------
// ADMIN VIEW MESSAGES
// ------------------------
app.get('/admin/messages', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin.html'); // only admins can view
    }

    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// ------------------------
// ADMIN PORTFOLIO ROUTES
// ------------------------

// View all portfolio items
app.get('/admin/portfolio', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin.html');
    }

    try {
        const result = await pool.query('SELECT * FROM portfolio ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// Add a new portfolio item
app.post('/admin/portfolio', async (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send('Unauthorized');
    }

    const { title, description, image_url } = req.body;
    if (!title || !description) {
        return res.status(400).send('Title and description required');
    }

    try {
        await pool.query(
            'INSERT INTO portfolio (title, description, image_url) VALUES ($1, $2, $3)',
            [title, description, image_url]
        );
        res.sendStatus(201);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// Update an existing portfolio item
app.put('/admin/portfolio/:id', async (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send('Unauthorized');
    }

    const { id } = req.params;
    const { title, description, image_url } = req.body;

    try {
        await pool.query(
            'UPDATE portfolio SET title=$1, description=$2, image_url=$3 WHERE id=$4',
            [title, description, image_url, id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// Delete a portfolio item
app.delete('/admin/portfolio/:id', async (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send('Unauthorized');
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM portfolio WHERE id=$1', [id]);
        res.sendStatus(200);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server error');
    }
});

// ------------------------
// START SERVER
// ------------------------
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});