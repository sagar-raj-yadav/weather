import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// SQL Database Connection
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Create tables
const createTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS weather_searches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      city VARCHAR(255) NOT NULL,
      weather_info TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
};
await createTables();

// Signup Route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [
      username,
      hashedPassword,
    ]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [user] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user[0].id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to Authenticate Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Weather Search Route
app.post('/weather', authenticateToken, async (req, res) => {
  const { city } = req.body;
  const userId = req.user.id;

  const apiKey = process.env.WEATHER_API_KEY;
  try {
    const response = await fetch(
      `http://api.weatherstack.com/current?access_key=${apiKey}&query=${city}`
    );
    const weatherData = await response.json();
    if (!weatherData.current) {
      return res.status(400).json({ error: 'City not found' });
    }
    const weatherInfo = JSON.stringify(weatherData.current);
    await db.query(
      'INSERT INTO weather_searches (user_id, city, weather_info) VALUES (?, ?, ?)',
      [userId, city, weatherInfo]
    );
    res.status(200).json({ weather: weatherData.current });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Weather Report Route
app.get('/report', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT users.username, weather_searches.city, weather_searches.weather_info
      FROM weather_searches
      JOIN users ON weather_searches.user_id = users.id
    `);
    res.status(200).json({ report: rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start Server
app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
