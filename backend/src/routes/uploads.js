const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { supabase, STORAGE_BUCKET, publicUrl } = require('../supabase');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

function safeName(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-z0-9-_]/gi, '_').slice(0, 50);
  const id = crypto.randomBytes(6).toString('hex');
  return `${base}_${Date.now()}_${id}${ext}`;
}

router.post('/upload-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filename = safeName(req.file.originalname);
    const objectPath = `uploads/${filename}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) return res.status(500).json({ error: error.message });

    const url = publicUrl(objectPath);
    return res.json({ url, path: objectPath });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
