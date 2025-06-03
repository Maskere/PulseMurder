const http = require("http");
const url = require("url");
const WebSocket = require("ws");

// Create HTTP server
const httpServer = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);

        // Broadcast the message to all clients
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', function() {
        console.log('Client disconnected');
    });
});

function broadcastData(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

httpServer.on("request", (req, res) => {
  const pathname = url.parse(req.url).pathname;
  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>WebSocket Data Display</title>
      </head>
      <body>
          <h1>WebSocket Data Display</h1>
          <div id="data"></div>
          <script>
              const ws = new WebSocket("ws://192.168.14.248:8081");
              ws.onmessage = function(event) {
                  document.getElementById("data").innerText = event.data;
              };
          </script>
      </body>
      </html>
    `);
  }
});

const port =  8082; // Use the port specified by Azure or default to 3000

httpServer.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
});

