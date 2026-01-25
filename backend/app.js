require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, initDb } = require('./database');
const authenticateToken = require('./authMiddleware');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';

// Initialize Database
initDb();

// Public Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('SWENG 861 CRUD Project Backend - Week 2 Auth Enabled');
});

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Missing fields' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists or invalid data' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(403).json({ error: 'Invalid password' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected Route
app.get('/secure-data', authenticateToken, (req, res) => {
  res.json({
    message: 'This is protected data.',
    user: req.user,
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
