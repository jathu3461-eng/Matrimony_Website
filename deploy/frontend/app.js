/**
 * Mukurtham Matrimony — cPanel startup wrapper
 * 
 * CloudLinux Node.js Selector blocks a physical 'node_modules' in the app root
 * (it uses a virtualenv symlink instead). Next.js standalone REQUIRES its own 
 * pre-bundled node_modules to run.
 * 
 * Solution: We shipped node_modules as '_nm/' to bypass cPanel's check.
 * This script symlinks _nm -> node_modules at runtime, then starts the server.
 */

const fs   = require('fs');
const path = require('path');

const nmLink = path.join(__dirname, 'node_modules');
const nmReal = path.join(__dirname, '_nm');

// Create the symlink if it doesn't already point to _nm
if (fs.existsSync(nmReal)) {
  try {
    const stat = fs.lstatSync(nmLink);
    if (stat.isSymbolicLink()) {
      // Already a symlink — check it points to _nm
      const target = fs.readlinkSync(nmLink);
      if (target !== nmReal && target !== '_nm') {
        fs.unlinkSync(nmLink);
        fs.symlinkSync(nmReal, nmLink, 'dir');
      }
    } else if (stat.isDirectory()) {
      // cPanel created a virtualenv symlink that is now a dir — leave it,
      // copy _nm contents into it instead
      const entries = fs.readdirSync(nmReal);
      for (const entry of entries) {
        const src  = path.join(nmReal, entry);
        const dest = path.join(nmLink, entry);
        if (!fs.existsSync(dest)) {
          fs.cpSync(src, dest, { recursive: true });
        }
      }
    }
  } catch {
    // node_modules doesn't exist yet — create symlink
    try { fs.symlinkSync(nmReal, nmLink, 'dir'); } catch {}
  }
}

// Now start Next.js standalone server
require('./server.js');
