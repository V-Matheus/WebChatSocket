# Documentação do Backend - WebChat Socket

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [WebSocket - RFC 6455](#websocket---rfc-6455)
4. [Fluxo de Comunicação](#fluxo-de-comunicação)
5. [Estrutura de Código](#estrutura-de-código)
6. [API REST](#api-rest)
7. [Sistema de Salas](#sistema-de-salas)
8. [Exemplos de Uso](#exemplos-de-uso)

### 📚 Documentação Adicional

- **[FLOW_DIAGRAM.md](FLOW_DIAGRAM.md)** - Diagramas visuais de fluxo detalhados (ASCII art)
- **[EXAMPLES.md](EXAMPLES.md)** - Exemplos práticos de código, testes e debugging

---

## Visão Geral

O backend é um servidor **API REST + WebSocket** desenvolvido em Node.js com TypeScript, sem uso de frameworks externos. Implementa o protocolo WebSocket (RFC 6455) de forma nativa para comunicação em tempo real.

### Características

- ✅ WebSocket nativo (sem bibliotecas como Socket.io)
- ✅ Sistema de salas independentes
- ✅ Broadcast de mensagens
- ✅ API REST para informações do servidor
- ✅ TypeScript com tipagem forte
- ✅ Padrão MVC (Model-View-Controller)
- ✅ Singleton para gerenciamento de salas

### Portas

- **Porta 3000**: API REST + WebSocket Server

---

## Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────┐
│                   Server                        │
│  - Orquestra HTTP e WebSocket                   │
│  - Inicializa controladores                     │
└───────────┬─────────────────┬───────────────────┘
            │                 │
            │                 │
    ┌───────▼──────┐   ┌─────▼──────────────┐
    │ HttpController│   │ WebSocketController│
    │               │   │                    │
    │ - /api/*      │   │ - Upgrade HTTP     │
    └───────────────┘   │ - Gerencia conexões│
                        └─────┬──────────────┘
                              │
                        ┌─────▼──────────┐
                        │  RoomManager   │
                        │  (Singleton)   │
                        │                │
                        │ - Broadcast    │
                        │ - Add/Remove   │
                        └────────────────┘
```

### Padrões de Design

1. **Singleton**: `RoomManager` - única instância gerencia todas as salas
2. **MVC**: Separação entre Controllers, Services e Managers
3. **Dependency Injection**: Controllers recebem dependências no construtor

---

## WebSocket - RFC 6455

### O que é WebSocket?

WebSocket é um protocolo de comunicação **full-duplex** sobre TCP. Diferente do HTTP tradicional (request/response), permite comunicação **bidirecional** em tempo real.

### Handshake WebSocket

#### 1. Cliente envia requisição HTTP Upgrade

```http
GET /ws/room123 HTTP/1.1
Host: localhost:3000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

#### 2. Servidor responde com 101 Switching Protocols

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

#### 3. Cálculo do Sec-WebSocket-Accept

```typescript
// WebSocketService.ts - linha 17
static generateAcceptValue(secWebSocketKey: string): string {
  const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  return crypto
    .createHash("sha1")
    .update(secWebSocketKey + GUID, "binary")
    .digest("base64");
}
```

**Como funciona:**
1. Pega a chave do cliente (`Sec-WebSocket-Key`)
2. Concatena com o GUID mágico da RFC 6455
3. Calcula SHA-1 hash
4. Codifica em Base64
5. Retorna no header `Sec-WebSocket-Accept`

### Frame WebSocket

Após o handshake, os dados são enviados em **frames**.

#### Estrutura de um Frame

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

#### Decodificação de Frame (Cliente → Servidor)

```typescript
// WebSocketService.ts - linha 45
static decodeFrame(data: Buffer): string {
  const secondByte = data[1];
  const length = secondByte & 127; // Remove o bit MASK

  let maskStart = 2;
  if (length === 126) maskStart = 4;      // 16-bit extended length
  if (length === 127) maskStart = 10;     // 64-bit extended length

  const masks = data.slice(maskStart, maskStart + 4); // 4 bytes de máscara
  const payload = data.slice(maskStart + 4);

  // Decodifica aplicando XOR com a máscara
  let msg = "";
  for (let i = 0; i < payload.length; ++i) {
    msg += String.fromCharCode(payload[i] ^ masks[i % 4]);
  }

  return msg;
}
```

**Por que mascarar?**
- Frames do **cliente → servidor** DEVEM ser mascarados (segurança)
- Frames do **servidor → cliente** NÃO são mascarados
- Máscara é um valor aleatório de 4 bytes
- XOR com máscara garante que intermediários (proxies) não interpretem dados como HTTP

#### Codificação de Frame (Servidor → Cliente)

```typescript
// WebSocketService.ts - linha 69
static encodeFrame(str: string): Buffer {
  const payload = Buffer.from(str);
  const frame: number[] = [0x81]; // FIN=1, opcode=1 (text)

  if (payload.length < 126) {
    frame.push(payload.length);
  } else if (payload.length < 65536) {
    frame.push(126, payload.length >> 8, payload.length & 0xff);
  } else {
    throw new Error("Payload muito grande");
  }

  return Buffer.concat([Buffer.from(frame), payload]);
}
```

**Explicação:**
- `0x81` = `10000001` em binário
  - Bit 7 (FIN) = 1: frame completo
  - Bits 0-3 (opcode) = 1: texto
- Servidor NÃO adiciona máscara (bit MASK = 0)

---

## Fluxo de Comunicação

### 1. Cliente Conecta ao WebSocket

```javascript
// Frontend
const ws = new WebSocket('ws://localhost:3000/ws/room123');
```

**Backend recebe:**
1. `server.ts` detecta evento `upgrade`
2. Chama `WebSocketController.handleUpgrade()`
3. Extrai `roomId` da URL (`/ws/room123`)
4. Valida `Sec-WebSocket-Key`
5. Executa handshake (`WebSocketService.performHandshake()`)
6. Adiciona cliente à sala (`RoomManager.addClientToRoom()`)
7. Configura event listeners (`setupSocketHandlers()`)

### 2. Cliente Envia Mensagem

```javascript
// Frontend
const message = {
  type: 'message',
  username: 'João',
  text: 'Olá!',
  timestamp: '2025-12-04T10:30:00Z'
};
ws.send(JSON.stringify(message));
```

**Backend processa:**
1. Socket emite evento `data` com Buffer
2. `handleData()` é chamado
3. `WebSocketService.decodeFrame()` decodifica o frame
4. Extrai a string JSON
5. `RoomManager.broadcast()` envia para todos da sala
6. `WebSocketService.encodeFrame()` codifica resposta
7. `client.write()` envia para cada cliente

### 3. Broadcast para Todos

```typescript
// RoomManager.ts - linha 58
broadcast(roomId: string, message: string): void {
  const room = this.rooms.get(roomId);
  if (!room) return;

  const frame = WebSocketService.encodeFrame(message);

  room.forEach((client) => {
    client.write(frame); // Envia para TODOS, incluindo remetente
  });
}
```

### 4. Cliente Desconecta

**Eventos tratados:**
- `close`: Conexão fechada normalmente
- `end`: Socket terminou
- `error`: Erro na conexão

**Todos chamam:**
```typescript
handleDisconnect(socket: Duplex, roomId: string): void {
  this.roomManager.removeClientFromRoom(roomId, socket);
}
```

---

## Estrutura de Código

### Hierarquia de Arquivos

```
backend/src/
├── server.ts                    # Ponto de entrada
├── controllers/
│   ├── HttpController.ts        # Rotas HTTP (API REST)
│   └── WebSocketController.ts   # Gerencia conexões WebSocket
├── services/
│   └── WebSocketService.ts      # Implementação RFC 6455
├── managers/
│   └── RoomManager.ts           # Gerencia salas (Singleton)
└── utils/
    ├── NetworkUtils.ts          # Obtém IP da rede
    └── RoomIdGenerator.ts       # Gera IDs únicos
```

### Responsabilidades

| Arquivo | Responsabilidade |
|---------|------------------|
| `server.ts` | Inicializa servidor HTTP e WebSocket |
| `HttpController.ts` | Trata requisições HTTP (API) |
| `WebSocketController.ts` | Gerencia upgrade e eventos WebSocket |
| `WebSocketService.ts` | Implementa protocolo WebSocket RFC 6455 |
| `RoomManager.ts` | Gerencia salas e broadcast de mensagens |
| `NetworkUtils.ts` | Obtém IP local da máquina |
| `RoomIdGenerator.ts` | Gera IDs aleatórios para salas |

---

## API REST

### GET /api/server-info

Retorna informações do servidor (IP e portas).

**Request:**
```http
GET /api/server-info HTTP/1.1
Host: localhost:3000
```

**Response:**
```json
{
  "ip": "192.168.0.52",
  "port": 3000,
  "wsPort": 3000
}
```

**Headers:**
```http
Content-Type: application/json
Access-Control-Allow-Origin: *
```

**Uso:**
- Frontend busca o IP para gerar QR Code
- Permite acesso de dispositivos na mesma rede

---

## Sistema de Salas

### RoomManager (Singleton)

```typescript
class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Set<Duplex>>; // roomId → Set de sockets

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }
}
```

### Estrutura de Dados

```typescript
rooms: Map<string, Set<Duplex>>

// Exemplo:
{
  "room123": Set([socket1, socket2, socket3]),
  "abc456":  Set([socket4, socket5])
}
```

### Métodos Principais

#### addClientToRoom
```typescript
addClientToRoom(roomId: string, socket: Duplex): void {
  if (!this.rooms.has(roomId)) {
    this.rooms.set(roomId, new Set());
  }
  this.rooms.get(roomId)!.add(socket);
}
```

#### removeClientFromRoom
```typescript
removeClientFromRoom(roomId: string, socket: Duplex): void {
  const room = this.rooms.get(roomId);
  if (room) {
    room.delete(socket);
    if (room.size === 0) {
      this.rooms.delete(roomId); // Remove sala vazia
    }
  }
}
```

#### broadcast
```typescript
broadcast(roomId: string, message: string): void {
  const room = this.rooms.get(roomId);
  if (!room) return;

  const frame = WebSocketService.encodeFrame(message);

  room.forEach((client) => {
    client.write(frame); // Envia para todos
  });
}
```

---

## Exemplos de Uso

### Exemplo 1: Cliente Conecta

```typescript
// URL: ws://localhost:3000/ws/room123

// 1. WebSocketController.handleUpgrade()
const roomId = "room123"; // extraído da URL

// 2. Handshake
WebSocketService.performHandshake(socket, key);

// 3. Adiciona à sala
RoomManager.getInstance().addClientToRoom(roomId, socket);

// 4. Setup handlers
socket.on('data', (buffer) => {
  const message = WebSocketService.decodeFrame(buffer);
  RoomManager.getInstance().broadcast(roomId, message);
});
```

### Exemplo 2: Mensagem JSON

**Cliente envia:**
```json
{
  "type": "message",
  "username": "João",
  "text": "Olá pessoal!",
  "timestamp": "2025-12-04T10:30:00Z"
}
```

**Servidor processa:**
```typescript
// 1. Decodifica frame
const json = WebSocketService.decodeFrame(buffer);
// json = '{"type":"message","username":"João",...}'

// 2. Broadcast para todos na sala
RoomManager.getInstance().broadcast('room123', json);

// 3. Cada cliente recebe o frame codificado
const frame = WebSocketService.encodeFrame(json);
client.write(frame);
```

**Todos os clientes recebem:**
```json
{
  "type": "message",
  "username": "João",
  "text": "Olá pessoal!",
  "timestamp": "2025-12-04T10:30:00Z"
}
```

### Exemplo 3: Mensagem de Sistema

**Cliente entra na sala:**
```json
{
  "type": "join",
  "username": "Maria",
  "timestamp": "2025-12-04T10:31:00Z"
}
```

**Broadcast:**
- Servidor NÃO adiciona lógica de negócio
- Apenas retransmite o JSON
- Frontend decide como renderizar (mensagem de sistema)

---

## Performance e Escalabilidade

### Características

- **In-Memory**: Todas as salas em memória (Map + Set)
- **Single-Threaded**: Node.js event loop
- **Sem Persistência**: Mensagens não são salvas

### Limitações

- **Memória**: Quantidade de salas/clientes limitada pela RAM
- **Single Server**: Não suporta múltiplas instâncias (sem Redis/cluster)
- **Sem Histórico**: Mensagens antigas não são armazenadas

### Melhorias Possíveis

1. **Redis**: Pub/Sub para múltiplos servidores
2. **Database**: Persistir mensagens (MongoDB, PostgreSQL)
3. **Cluster Mode**: Múltiplos workers Node.js
4. **Rate Limiting**: Limitar mensagens por segundo
5. **Authentication**: JWT ou tokens de sessão

---

## Debugging

### Logs Úteis

```typescript
// WebSocketController.ts
console.log('Cliente conectado na sala:', roomId);
console.log('Clientes na sala:', RoomManager.getInstance().getRoomSize(roomId));

// RoomManager.ts
console.log('Broadcast para', room.size, 'clientes');

// WebSocketService.ts
console.log('Frame decodificado:', message);
```

### Testar WebSocket via curl

```bash
# Handshake manual
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:3000/ws/test
```

### Testar com wscat

```bash
npm install -g wscat

# Conectar
wscat -c ws://localhost:3000/ws/room123

# Enviar mensagem
> {"type":"message","username":"Test","text":"Olá"}
```

---

## Referências

- [RFC 6455 - WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [MDN - WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js - Net Module](https://nodejs.org/api/net.html)
- [Node.js - HTTP Module](https://nodejs.org/api/http.html)

---

## Conclusão

Este backend implementa um **WebSocket server completo** sem dependências de frameworks, seguindo fielmente a RFC 6455. A arquitetura modular e uso de padrões de design facilitam manutenção e extensão futura.

**Principais diferenciais:**
- ✅ WebSocket nativo (sem Socket.io)
- ✅ Código limpo e documentado
- ✅ TypeScript com tipagem forte
- ✅ Fácil de entender e modificar
