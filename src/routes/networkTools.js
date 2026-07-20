const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const router = express.Router();

// Sanitasi input IP — hanya izinkan IPv4 format
function sanitizeIP(input) {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(input)) return null;
  const parts = input.split('.').map(Number);
  if (parts.some(p => p < 0 || p > 255)) return null;
  return input;
}

// Sanitasi input MAC — hanya izinkan format MAC address
function sanitizeMAC(input) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
  if (!macRegex.test(input)) return null;
  return input.toUpperCase();
}

// GET /api/ping/:ip
router.get('/ping/:ip', (req, res) => {
  const ip = sanitizeIP(req.params.ip);
  if (!ip) {
    return res.status(400).json({ error: 'Invalid IP address format' });
  }

  exec(`ping -c 4 -W 5 ${ip}`, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error && !stdout) {
      return res.json({ ip, status: 'unreachable', output: `Host ${ip} tidak dapat dijangkau.` });
    }
    res.json({ ip, status: 'ok', output: stdout });
  });
});

// GET /api/mac/:mac
router.get('/mac/:mac', (req, res) => {
  const mac = sanitizeMAC(req.params.mac);
  if (!mac) {
    return res.status(400).json({ error: 'Invalid MAC address format. Gunakan format XX:XX:XX:XX:XX:XX' });
  }

  const prefix = mac.replace(/[:-]/g, '').substring(0, 6).toUpperCase();

  // Coba cek dari cache lokal dulu via arp
  exec(`arp -n 2>/dev/null | grep -i "${mac}" || true`, { timeout: 5000 }, (arpErr, arpOut) => {
    let localInfo = null;
    if (arpOut && arpOut.trim()) {
      const parts = arpOut.trim().split(/\s+/);
      localInfo = { ip: parts[0] || null, interface: parts[2] || null };
    }

    // Ambil vendor dari API publik macvendors.co
    const https = require('https');
    const apiUrl = `https://api.macvendors.com/${mac}`;

    https.get(apiUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        const vendor = apiRes.statusCode === 200 ? data.trim() : null;
        res.json({
          mac,
          oui: prefix,
          vendor: vendor || 'Unknown',
          localInfo,
        });
      });
    }).on('error', () => {
      res.json({
        mac,
        oui: prefix,
        vendor: 'Unknown (API unreachable)',
        localInfo,
      });
    });
  });
});

module.exports = router;
