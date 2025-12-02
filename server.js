const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const clientsPerRoom = {};

function generateRoomId() {
  return crypto.randomBytes(4).toString('hex');
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // Cria uma nova sala e redireciona
    const roomId = generateRoomId();
    res.writeHead(302, { Location: `/room/${roomId}` });
    res.end();
  } else if (req.url.startsWith('/room/')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro interno');
        return;
      }
      const ip = getLocalIP();
      let html = data.toString();
      html = html.replace('__SERVER_IP__', ip);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  } else if (req.url === '/qrcode.min.js') {
    fs.readFile(path.join(__dirname, 'qrcode.min.js'), (err, data) => {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.on('upgrade', (req, socket) => {
  const url = req.url;
  const match = url.match(/^\/ws\/(.+)$/);
  if (!match) {
    socket.destroy();
    return;
  }
  const roomId = match[1];

  // Handshake WebSocket
  const key = req.headers['sec-websocket-key'];
  const acceptKey = generateAcceptValue(key);
  socket.write(
    'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
    '\r\n'
  );

  if (!clientsPerRoom[roomId]) clientsPerRoom[roomId] = [];
  clientsPerRoom[roomId].push(socket);

  socket.on('data', (buffer) => {
    const msg = decodeWebSocketFrame(buffer);
    if (msg) {
      // Broadcast para todos na sala
      clientsPerRoom[roomId].forEach(client => {
        if (client !== socket) {
          client.write(encodeWebSocketFrame(msg));
        }
      });
    }
  });

  socket.on('close', () => {
    clientsPerRoom[roomId] = clientsPerRoom[roomId].filter(c => c !== socket);
  });

  socket.on('end', () => {
    clientsPerRoom[roomId] = clientsPerRoom[roomId].filter(c => c !== socket);
  });
});

function generateAcceptValue(secWebSocketKey) {
  return require('crypto')
    .createHash('sha1')
    .update(secWebSocketKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

// Decodifica frame WebSocket (apenas texto, sem fragmentação)
function decodeWebSocketFrame(data) {
  const secondByte = data[1];
  const length = secondByte & 127;
  let maskStart = 2;
  if (length === 126) maskStart = 4;
  if (length === 127) maskStart = 10;
  const masks = data.slice(maskStart, maskStart + 4);
  const payload = data.slice(maskStart + 4);
  let msg = '';
  for (let i = 0; i < payload.length; ++i) {
    msg += String.fromCharCode(payload[i] ^ masks[i % 4]);
  }
  return msg;
}

// Codifica frame WebSocket (apenas texto, sem fragmentação)
function encodeWebSocketFrame(str) {
  const payload = Buffer.from(str);
  const frame = [0x81];
  if (payload.length < 126) {
    frame.push(payload.length);
  } else if (payload.length < 65536) {
    frame.push(126, payload.length >> 8, payload.length & 0xff);
  } else {
    // Não suporta payloads grandes
    throw new Error('Payload muito grande');
  }
  return Buffer.concat([Buffer.from(frame), payload]);
}

function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (let iface of Object.values(interfaces)) {
    for (let i of iface) {
        if (i.family === 'IPv4' && !i.internal) return i.address;
    }
    }
    return 'localhost';
}

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});