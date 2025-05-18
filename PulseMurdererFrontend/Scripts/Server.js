const dgram = require("dgram");
const http = require("http");
const url = require("url");
const WebSocket = require("ws");

const server = dgram.createSocket("udp4");
const httpServer = http.createServer();
const wss = new WebSocket.Server({ server: httpServer });

let udpData = "";

wss.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);

        // Broadcast the message to all clients
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
    });

    ws.on('close', function() {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on ws://localhost:8080');
server.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    udpData = msg.toString();
    broadcastData(udpData);
});

server.on("listening", () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(8080);

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
          <title>UDP Data Display</title>
      </head>
      <body>
          <h1>UDP Data Display</h1>
          <div id="data"></div>
          <script>
              const ws = new WebSocket("ws://localhost:8080");
              ws.onmessage = function(event) {
                  document.getElementById("data").innerText = event.data;
              };
          </script>
      </body>
      </html>
    `);
  }
});

httpServer.listen(8080, () => {
    console.log("HTTP server listening on port 8080");
});

