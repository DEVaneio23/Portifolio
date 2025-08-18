export default async function handler(req, res) {
  try {
    const upstream = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    const r = await fetch(upstream);
    if (!r.ok) {
      res.status(r.status).send('');
      return;
    }
    const code = await r.text();
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(code);
  } catch (e) {
    res.status(500).send('// vendor proxy error');
  }
}


