# WebChat Socket 💬

Sistema de chat em tempo real com WebSocket e QR Code, desenvolvido com TypeScript e React.

## 🚀 Características

- ✅ Chat em tempo real com WebSocket
- ✅ Interface moderna inspirada no WhatsApp
- ✅ QR Code para compartilhar salas de chat
- ✅ Identificação de usuários com cores únicas
- ✅ Sistema de salas independentes
- ✅ **Frontend**: React + Vite (porta 5173)
- ✅ **Backend**: API REST + WebSocket (porta 3000)
- ✅ Arquitetura separada e independente

## 📋 Pré-requisitos

- Node.js 16+ instalado
- NPM ou Yarn

## 🔧 Instalação

### Instalar todas as dependências (backend + frontend):

```bash
npm install
```

Ou instalar separadamente:

```bash
# Backend
npm run install:backend

# Frontend
npm run install:frontend
```

## 🎮 Como usar

### Desenvolvimento Local (Mesma Rede WiFi)

Execute o backend e o frontend em **terminais separados**:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

- **Backend (API + WebSocket)**: `http://localhost:3000`
- **Frontend (Interface React)**: `http://localhost:5173`
- **Acesso**: Via `http://localhost:5173` ou IP da rede (ex: `192.168.x.x:5173`)

### 🌐 Desenvolvimento com Acesso Público (ngrok)

Para permitir acesso de **qualquer lugar do mundo**:

**Terminal 1 - Backend com ngrok:**
```bash
npm run dev:ngrok
```

Você receberá uma URL pública (ex: `https://abc123.ngrok-free.app`)

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

**📱 Compartilhe a URL pública** e qualquer pessoa pode acessar!

👉 **[Guia Completo de Configuração do ngrok](NGROK_SETUP.md)**

### Arquitetura em Desenvolvimento

```
Frontend (Vite) :5173  →  Proxy /api  →  Backend :3000  →  ngrok → 🌍 Internet
                       ↘  WebSocket   →  Backend :3000/ws
```

## 💡 Como funciona

1. **Acesse o frontend** em `http://localhost:5173`
2. **Digite seu nome** para entrar no chat
3. **Compartilhe o QR Code** com outros usuários para entrarem na mesma sala
   - O QR Code contém o **IP da sua máquina na rede local**
   - Outros dispositivos na mesma rede WiFi podem escanear e entrar
4. **Comece a conversar!** Cada usuário terá uma cor única

### 📱 Acessando de outros dispositivos

O QR Code gerado automaticamente usa o **IP da rede local** da máquina onde o backend está rodando. Isso significa que:

- ✅ Qualquer dispositivo na mesma rede WiFi pode acessar
- ✅ Funciona com celulares, tablets, outros computadores
- ✅ Não precisa de localhost ou configuração manual
- 📍 Exemplo de IP: `192.168.1.100:3000`

## 🏗️ Estrutura do Projeto

```
WebChatSocket/
├── backend/           # Servidor WebSocket (TypeScript)
│   ├── src/
│   │   ├── controllers/
│   │   ├── managers/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── frontend/          # Interface React
│   ├── src/
│   │   ├── components/
│   │   │   ├── WelcomeScreen.jsx
│   │   │   ├── ChatRoom.jsx
│   │   │   └── *.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── package.json       # Scripts raiz
```

## 🎨 Features

### Tela de Boas-vindas
- Campo para inserir nome do usuário
- QR Code para compartilhar a sala
- Botão para copiar link da sala

### Chat
- Mensagens estilo WhatsApp
- Cores únicas por usuário
- Indicador de conexão
- Scroll automático
- Horário das mensagens
- Mensagens do sistema (entrada/saída)

## 🛠️ Tecnologias

### Backend (API + WebSocket Server)
- Node.js + TypeScript
- WebSocket nativo (RFC 6455)
- API REST para informações do servidor
- Sem dependências de framework (HTTP puro)

### Frontend (SPA React)
- React 18
- Vite (dev server + build)
- QRCode.react
- CSS moderno
- WebSocket client nativo

## 📝 Scripts Disponíveis

```bash
# Instalação
npm install              # Instala backend + frontend
npm run install:backend  # Instala apenas backend
npm run install:frontend # Instala apenas frontend

# Build
npm run build           # Build backend + frontend

# Desenvolvimento
npm run dev:backend     # Backend local (localhost)
npm run dev:frontend    # Frontend local
npm run dev:ngrok       # Backend com acesso público (ngrok)

# Produção
npm start               # Inicia backend em produção
```

## 📚 Documentação Técnica

- **[Backend Documentation](backend/DOCUMENTATION.md)** - Documentação completa do WebSocket e arquitetura do backend
- **[ngrok Setup Guide](NGROK_SETUP.md)** - Guia completo de configuração do acesso público
- **[Troubleshooting](TROUBLESHOOTING.md)** - Guia de resolução de problemas comuns

## 🤝 Como contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

ISC

---

Desenvolvido com ❤️ para disciplina de Sistemas Distribuídos
