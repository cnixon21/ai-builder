const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const handler = require('./api/roadmap');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/roadmap') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (body) {
        try { req.body = JSON.parse(body); } catch { req.body = {}; }
      } else {
        req.body = {};
      }
      res.json = (data) => {
        res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      res.status = (code) => { res.statusCode = code; return res; };
      handler(req, res).catch(err => {
        console.error(err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    });
    return;
  }

  // Serve HTML files from the project root
  let filePath;
  if (url.pathname === '/') {
    filePath = path.join(__dirname, 'ai-builder-dashboard.html');
  } else if (url.pathname.endsWith('.html')) {
    filePath = path.join(__dirname, path.basename(url.pathname));
  }

  if (filePath && fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
