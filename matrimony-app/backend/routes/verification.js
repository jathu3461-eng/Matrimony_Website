const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── Storage ─────────────────────────────────────────────────────────────────
const VIDEO_DIR = path.join(__dirname, '..', 'uploads', 'verification-videos');
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const safe = crypto.randomBytes(16).toString('hex');
    cb(null, `vv-${req.user.id}-${safe}${ext}`);
  },
});

const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

function videoFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!VIDEO_EXTS.includes(ext)) {
    return cb(new Error('Please select a valid video file (MP4, MOV, WebM)'));
  }
  cb(null, true);
}

const upload = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: MAX_SIZE },
});

// ─── MP4 Duration Parser (pure Node.js, no ffmpeg needed) ───────────────────
// Reads the moov atom from an MP4 file to extract duration.
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fd = fs.openSync(filePath, 'r');
      const stat = fs.fstatSync(fd);
      const fileSize = stat.size;

      // Read first 64KB to find moov atom (usually near the start for web-optimized, or near end)
      const headerBuf = Buffer.alloc(Math.min(fileSize, 256 * 1024));
      fs.readSync(fd, headerBuf, 0, headerBuf.length, 0);
      fs.closeSync(fd);

      // Search for moov atom
      let moovOffset = -1;
      let moovSize = 0;
      let pos = 0;

      while (pos < headerBuf.length - 8) {
        const atomSize = headerBuf.readUInt32BE(pos);
        const atomType = headerBuf.toString('ascii', pos + 4, pos + 8);

        if (atomSize < 8 || pos + atomSize > headerBuf.length + 1024) break;

        if (atomType === 'moov') {
          moovOffset = pos;
          moovSize = atomSize;
          break;
        }
        pos += atomSize;
      }

      // If moov not in header, try reading near end of file
      if (moovOffset === -1 && fileSize > 256 * 1024) {
        const endBuf = Buffer.alloc(Math.min(fileSize, 256 * 1024));
        const readStart = Math.max(0, fileSize - endBuf.length);
        const fd2 = fs.openSync(filePath, 'r');
        fs.readSync(fd2, endBuf, 0, endBuf.length, readStart);
        fs.closeSync(fd2);

        pos = 0;
        while (pos < endBuf.length - 8) {
          const atomSize = endBuf.readUInt32BE(pos);
          const atomType = endBuf.toString('ascii', pos + 4, pos + 8);
          if (atomSize < 8) break;
          if (atomType === 'moov') {
            moovOffset = readStart + pos;
            moovSize = atomSize;
            break;
          }
          pos += atomSize;
        }
      }

      if (moovOffset === -1) {
        // Could not find moov atom — return null (let caller decide)
        return resolve(null);
      }

      // Read the moov atom
      const moovBuf = Buffer.alloc(Math.min(moovSize, 1024 * 1024));
      const fd3 = fs.openSync(filePath, 'r');
      fs.readSync(fd3, moovBuf, 0, moovBuf.length, moovOffset);
      fs.closeSync(fd3);

      // Find mvhd atom inside moov
      let mvhdPos = -1;
      let p = 0;
      while (p < moovBuf.length - 8) {
        const sz = moovBuf.readUInt32BE(p);
        const tp = moovBuf.toString('ascii', p + 4, p + 8);
        if (sz < 8) break;
        if (tp === 'mvhd') {
          mvhdPos = p;
          break;
        }
        p += sz;
      }

      if (mvhdPos === -1) return resolve(null);

      const version = moovBuf[mvhdPos + 8];
      let timescale, duration;
      if (version === 0) {
        timescale = moovBuf.readUInt32BE(mvhdPos + 12);
        duration = moovBuf.readUInt32BE(mvhdPos + 16);
      } else {
        timescale = moovBuf.readUInt32BE(mvhdPos + 20);
        duration = Number(moovBuf.readBigUInt64BE(mvhdPos + 24));
      }

      if (!timescale || timescale === 0) return resolve(null);
      const seconds = duration / timescale;
      resolve(Math.round(seconds * 100) / 100);
    } catch (err) {
      reject(err);
    }
  });
}

// ─── POST /api/verification-video/upload ─────────────────────────────────────
// Authenticated user uploads verification video
router.post('/upload', requireAuth, (req, res) => {
  upload.single('verification_video')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Video file is too large. Maximum size is 200 MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please select a video file to upload.' });
    }

    try {
      const userId = req.user.id;
      const file = req.file;

      // Validate duration
      let duration = null;
      try {
        duration = await getVideoDuration(file.path);
      } catch (e) {
        console.error('Duration parse error:', e.message);
      }

      if (duration === null) {
        // Could not parse duration — accept but mark as needing review
        console.warn(`⚠️ Could not determine video duration for user ${userId}. File: ${file.filename}`);
      } else if (duration < 60) {
        // Delete the invalid file
        fs.unlinkSync(file.path);
        return res.status(400).json({
          error: 'VIDEO_DURATION_INVALID',
          message: 'Video must be at least 1 minute long.',
          duration,
        });
      } else if (duration > 180) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          error: 'VIDEO_DURATION_INVALID',
          message: 'Video must not exceed 3 minutes.',
          duration,
        });
      }

      // Delete any previous PENDING video for this user
      const [existing] = await db.all(
        'SELECT id, storage_key FROM verification_videos WHERE user_id = ? AND status = ?',
        [userId, 'PENDING']
      );
      if (existing) {
        for (const row of (Array.isArray(existing) ? existing : [existing])) {
          const oldPath = path.join(VIDEO_DIR, path.basename(row.storage_key));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          await db.run('DELETE FROM verification_videos WHERE id = ?', [row.id]);
        }
      }

      const storageKey = `verification-videos/${file.filename}`;
      await db.run(
        `INSERT INTO verification_videos (user_id, storage_key, original_filename, mime_type, file_size, duration_seconds, status)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
        [userId, storageKey, file.originalname, file.mimetype, file.size, duration ? Math.round(duration) : null]
      );

      res.json({
        success: true,
        message: 'Verification video uploaded successfully.',
        duration: duration ? Math.round(duration) : null,
        status: 'PENDING',
      });
    } catch (err) {
      console.error('Video upload error:', err);
      res.status(500).json({ error: 'Video upload failed. Please try again.' });
    }
  });
});

// ─── GET /api/verification-video/status ──────────────────────────────────────
// Get current user's verification video status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const rows = await db.all(
      'SELECT id, status, duration_seconds, uploaded_at, reviewed_at, rejection_reason FROM verification_videos WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1',
      [req.user.id]
    );
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return res.json({ status: null });
    res.json({
      status: row.status,
      duration: row.duration_seconds,
      uploadedAt: row.uploaded_at,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/verification-video/:id ──────────────────────────────────────
// Delete own video (for replacement)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM verification_videos WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Video not found' });
    const filePath = path.join(VIDEO_DIR, path.basename(row.storage_key));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.run('DELETE FROM verification_videos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ─── GET /api/verification-video/admin/all ───────────────────────────────────
router.get('/admin/all', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT vv.*, u.username, u.email, p.name AS profile_name
               FROM verification_videos vv
               JOIN users u ON u.id = vv.user_id
               LEFT JOIN profiles p ON p.owner_user_id = vv.user_id
               WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND vv.status = ?'; params.push(status); }
    sql += ' ORDER BY vv.uploaded_at DESC LIMIT 100';
    const rows = await db.all(sql, params);
    res.json({ videos: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/verification-video/admin/:id/stream ────────────────────────────
// Stream video to admin (authenticated, admin-only)
router.get('/admin/:id/stream', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM verification_videos WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Video not found' });

    const filePath = path.join(VIDEO_DIR, path.basename(row.storage_key));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Video file not found' });

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo' };
    const contentType = mimeTypes[ext] || 'video/mp4';

    // Support range requests for video seeking
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/verification-video/admin/:id/approve ─────────────────────────
router.post('/admin/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM verification_videos WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Video not found' });

    await db.run(
      'UPDATE verification_videos SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['APPROVED', req.user.id, req.params.id]
    );

    // Update user's phone_verified or add a verification flag if needed
    // For now just mark the video as approved

    res.json({ success: true, status: 'APPROVED' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/verification-video/admin/:id/reject ──────────────────────────
router.post('/admin/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const row = await db.get('SELECT * FROM verification_videos WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Video not found' });

    await db.run(
      'UPDATE verification_videos SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['REJECTED', reason || null, req.user.id, req.params.id]
    );

    res.json({ success: true, status: 'REJECTED' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
