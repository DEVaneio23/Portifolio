export default async function handler(req, res) {
  try {
    const upstream = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.53.0/+esm';
    const r = await fetch(upstream);
    if (!r.ok) {
      res.status(r.status).send('');
      return;
    }
    let code = await r.text();
    // Reescrever imports absolutos "/npm/..." para apontar ao CDN diretamente
    // Isso garante que sub-recursos do módulo sejam buscados no jsDelivr e não na origem local
    code = code.replace(/(["'])\/npm\//g, '$1https://cdn.jsdelivr.net/npm/');
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(code);
  } catch (e) {
    res.status(500).send('// vendor proxy error');
  }
}


