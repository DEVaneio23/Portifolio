const https = require('https');
const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, '..', 'vendor');
const assets = [
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', out: path.join(VENDOR_DIR, 'jspdf.umd.min.js') },
];

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function download(url, out) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(out);
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        file.close(); fs.unlink(out, () => {});
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { file.close(); fs.unlink(out, () => {}); reject(err); });
  });
}

(async () => {
  try {
    ensureDir(VENDOR_DIR);
    for (const a of assets) { await download(a.url, a.out); }
    // eslint-disable-next-line no-console
    console.log('Vendors fetched into', VENDOR_DIR);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('fetch-vendor failed:', e);
    process.exitCode = 1;
  }
})();


