const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import the cors package

const corsOptions = {
  origin: '*' // Set the allowed origin(s) here, or '*' to allow all origins (for development purposes)
};

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'client', req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Set the appropriate Content-Type header
    if (req.url.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (req.url.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    }

    // Use cors middleware before sending the response
    cors(corsOptions)(req, res, () => {
      res.writeHead(200);
      res.end(data);
    });
  });
});

server.listen(8080, () => {
  console.log('Server is running on port 8080');
});
