const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/settings', async (req, res) => {
  try {
    res.json({ settings: await db.get('SELECT * FROM settings WHERE id = 1') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/footer-settings', async (req, res) => {
  try {
    res.json({ footer_settings: await db.get('SELECT * FROM footer_settings WHERE id = 1') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/menu-items', async (req, res) => {
  try {
    res.json({ menu_items: await db.all('SELECT * FROM menu_items WHERE is_active = 1 ORDER BY display_order') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
