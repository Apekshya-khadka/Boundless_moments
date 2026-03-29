const express = require('express');
const session = require('express-session');
const path = require('path');
const pool = require('./routes/db.js'); // database connection

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }
}));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password required');

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );
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

// Dashboard
app.get('/admin/dashboard', (req, res) => {
    if (req.session.admin) {
        res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
    } else {
        res.redirect('/admin.html');
    }
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin.html');
    });
});

// Contact form
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).send('All fields are required');

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

// Local dev + export for Vercel
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;