require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { supabase, ensureStorage } = require('./supabase');

const reportsRouter = require('./routes/reports');
const uploadsRouter = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', async (_req, res) => {
  const { data, error } = await supabase.from('reports').select('id').limit(1);
  if (error) return res.status(200).json({ ok: true, db: false, error: error.message });
  return res.json({ ok: true, db: true });
});

app.use('/api', uploadsRouter);
app.use('/api', reportsRouter);

(async () => {
  try {
    await ensureStorage();
  } catch (e) {
    console.warn('Storage ensure failed:', e.message);
  }
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
})();
