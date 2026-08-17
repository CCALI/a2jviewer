const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = 8080;

const server = http.createServer((req, res) => {
  // ----------------------------------------------------
  // 1. [ROUTING] Handle Auto-Save POST Request
  // ----------------------------------------------------
  if (req.method === 'POST' && req.url === '/answers') {
    let body = '';
    
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', () => {
      const postData = querystring.parse(body);
      const answerKey = postData.AnswerKey || '';
      const answerKeyJSON = postData.AnswerKeyJSON || '';
      const timestamp = new Date().toLocaleTimeString();

      // [CONSOLE LOGS]
      console.log('\n==================================================');
      console.log(`[${timestamp}] 📥 Auto Save (AJAX) -> /answers received!`);
      console.log('==================================================');
      console.log(`- AnswerKey Length: ${answerKey.length} chars`);
      console.log(`- AnswerKeyJSON Length: ${answerKeyJSON.length} chars`);
      console.log('--------------------------------------------------');

      // [FILE SAVING]
      try {
        if (answerKey) {
          fs.writeFileSync('./debug_AnswerKey.xml', answerKey, 'utf-8');
          console.log(`- [File Saved] debug_AnswerKey.xml completed`);
        }
        if (answerKeyJSON) {
          let formattedJson = answerKeyJSON;
          try {
            // Pretty-print JSON for better readability
            formattedJson = JSON.stringify(JSON.parse(answerKeyJSON), null, 2);
          } catch (e) {}
          fs.writeFileSync('./debug_AnswerKey.json', formattedJson, 'utf-8');
          console.log(`- [File Saved] debug_AnswerKey.json completed`);
        }
      } catch (fileError) {
        console.error(`- ❌ File Write Error:`, fileError.message);
      }
      console.log('==================================================\n');

      // Send success response back to A2J Viewer
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, message: 'Saved successfully.' }));
    });
    return;
  }

  // ----------------------------------------------------
  // 2. [STATIC SERVING] Replace npx http-server dist_local
  // ----------------------------------------------------
  if (req.method === 'GET') {
    console.log('req.url', req.url);
    // Resolve URL path (default to index.html)
    let safeUrl = req.url === '/' ? '/index.html' : req.url;
    // Strip query strings if present (e.g., ?v=1.0)
    safeUrl = safeUrl.split('?')[0];
    
    const filePath = path.join(__dirname, safeUrl);

    // Content-Type mapping for static files
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Read and serve the file
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found - File does not exist.');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`500 Server Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Pure Node.js Server is running on http://localhost:${PORT}`);
  console.log(`💻 Open your browser at: http://localhost:${PORT}`);
  console.log(`📝 Set A2J Viewer's autoSetDataURL to: "/answers"\n`);
});