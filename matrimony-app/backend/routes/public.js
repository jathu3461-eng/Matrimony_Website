const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/settings', (req, res) => {
  res.json({ settings: db.prepare('SELECT * FROM settings WHERE id = 1').get() });
});

router.get('/footer-settings', (req, res) => {
  res.json({ footer_settings: db.prepare('SELECT * FROM footer_settings WHERE id = 1').get() });
});

router.get('/menu-items', (req, res) => {
  res.json({ menu_items: db.prepare('SELECT * FROM menu_items WHERE is_active = 1 ORDER BY display_order').all() });
});

module.exports = router;
