require('dotenv').config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const { dbReady } = require('./db');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const interestRoutes = require('./routes/interests');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Trust proxy (cPanel/Apache sits in front) ──────────────────────────────
app.set('trust proxy', 1);

// ── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'https://mukurtham.ca',
  'https://www.mukurtham.ca',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-side) or from allowed list
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Serve the built frontend in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) res.status(200).send('Matrimony API is running.');
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Wait for DB to be ready before accepting requests
dbReady.then(() => {
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`✅ Matrimony API server running on http://localhost:${PORT}`);
  });
});
