# Backend - WebChat Socket

Backend do sistema de chat em tempo real com WebSocket nativo (RFC 6455).

## 📚 Documentação

Este backend possui documentação completa em vários arquivos:

### 1. **[DOCUMENTATION.md](DOCUMENTATION.md)** - Documentação Principal
Documentação completa e detalhada sobre:
- Visão geral do projeto
- Arquitetura e padrões de design
- Explicação do protocolo WebSocket RFC 6455
- Como funciona o handshake
- Codificação e decodificação de frames
- Sistema de salas e broadcast
- API REST
- Performance e escalabilidade

### 2. **[FLOW_DIAGRAM.md](FLOW_DIAGRAM.md)** - Diagramas de Fluxo
Diagramas visuais em ASCII art mostrando:
- Fluxo completo: da conexão ao broadcast
- Detalhamento do handshake WebSocket
- Codificação/decodificação de frames
- Estrutura de dados do RoomManager
- Timeline de uma mensagem
- Comparação HTTP vs WebSocket

### 3. **[EXAMPLES.md](EXAMPLES.md)** - Exemplos Práticos
Exemplos de código e testes:
- Testar WebSocket no terminal (wscat)
- Cliente JavaScript/HTML
- Cliente Python
- Cliente Node.js
- Testar API REST com curl
- Debugging e logs
- Teste de carga (stress test)
- Troubleshooting

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 🏗️ Estrutura

```
backend/src/
├── server.ts                 # Ponto de entrada
├── controllers/
│   ├── HttpController.ts     # API REST
│   └── WebSocketController.ts # WebSocket
├── services/
│   └── WebSocketService.ts   # RFC 6455
├── managers/
│   └── RoomManager.ts        # Salas (Singleton)
└── utils/
    ├── NetworkUtils.ts       # IP local
    └── RoomIdGenerator.ts    # IDs únicos
```

## 🔌 Endpoints

### HTTP

- `GET /api/server-info` - Informações do servidor (IP e porta)

### WebSocket

- `ws://localhost:3000/ws/{roomId}` - Conecta à sala específica

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **WebSocket nativo** (sem Socket.io)
- **HTTP puro** (sem Express)
- Padrão **MVC**
- **Singleton** para gerenciamento de salas

## 📖 Leia Mais

Comece pela [DOCUMENTATION.md](DOCUMENTATION.md) para entender como tudo funciona!
