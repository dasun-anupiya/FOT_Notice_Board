import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import noticesRouter from './routes/notices.js';
import pollsRouter from './routes/polls.js';
import reportsRouter from './routes/reports.js';
import errorHandler from './middlewares/errorHandler.js';
import path from 'path';

// DEV NOTE: To allow both Vite and various local frontends, set this in backend/.env:
// CORS_ORIGIN=http://localhost:8080,http://localhost:5173
// Comma separated. Otherwise only the first will be allowed. Restart server after change.
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- CORS flexible multi-origin setup ---
const corsOriginSetting = process.env.CORS_ORIGIN || '*';
let allowedOrigins;
if (corsOriginSetting === '*') {
  allowedOrigins = '*';
} else if (corsOriginSetting.includes(',')) {
  allowedOrigins = corsOriginSetting.split(',').map(s => s.trim());
} else {
  allowedOrigins = [corsOriginSetting.trim()];
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed from ' + origin));
    }
  },
  credentials: true,
}));
app.options('*', cors()); // Enable pre-flight for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploads folder for local-hosted temporary files (only if you're using local uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// routes
app.use('/api/users', usersRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/reports', reportsRouter);

// health
app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
