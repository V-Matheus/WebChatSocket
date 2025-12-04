# Troubleshooting

## Problemas Comuns e Soluções

### 1. Erro 404 ao acessar via porta 3000 diretamente

**Sintoma:**
```
GET http://192.168.0.52:3000/src/main.jsx net::ERR_ABORTED 404 (Not Found)
Tela branca sem conteúdo
```

**Causa:**
O backend (porta 3000) precisa servir o build estático do React, não os arquivos de desenvolvimento.

**Solução:**
```bash
# 1. Fazer build do frontend
cd frontend
npm run build

# 2. Fazer build do backend
cd ../backend
npm run build

# 3. Iniciar servidor
npm start
```

Ou use o script raiz:
```bash
npm run build
npm start
```

### 2. Mensagens não estão sendo enviadas / não aparecem

**Sintoma:**
Quando você envia uma mensagem, ela não aparece para ninguém (nem para você).

**Causa:**
O backend estava fazendo broadcast apenas para outros clientes, excluindo o remetente. Como o frontend foi ajustado para não adicionar a mensagem localmente, o remetente nunca recebia sua própria mensagem.

**Solução:**
Já corrigido! O método `broadcast()` agora envia para TODOS os clientes da sala, incluindo o remetente.

### 3. Desenvolvimento vs Produção

#### Modo Desenvolvimento
- **Backend**: `npm run dev:backend` → porta 3000
- **Frontend**: `npm run dev:frontend` → porta 5173
- **Acesso**: `http://localhost:5173`
- **QR Code**: Não funcionará corretamente (apontará para IP errado)

#### Modo Produção (Recomendado para uso em rede)
- **Build**: `npm run build`
- **Start**: `npm start` → porta 3000 única
- **Acesso**: `http://SEU_IP:3000`
- **QR Code**: Funcionará perfeitamente na rede local

### 4. QR Code não funciona em outros dispositivos

**Causa:**
- Firewall bloqueando a porta 3000
- Dispositivos em redes WiFi diferentes
- Usando modo desenvolvimento (porta 5173)

**Solução:**
1. Use modo produção (`npm run build && npm start`)
2. Certifique-se de que todos dispositivos estão na mesma rede WiFi
3. Verifique o firewall:
   ```bash
   # Linux (UFW)
   sudo ufw allow 3000

   # Windows
   # Adicione exceção no Windows Firewall para porta 3000
   ```

### 5. WebSocket não conecta

**Sintoma:**
Status mostra "Desconectado" constantemente.

**Causa:**
O WebSocket está tentando conectar no IP/porta errado.

**Solução:**
Verifique se o backend está rodando:
```bash
curl http://localhost:3000/api/server-info
```

Deve retornar:
```json
{
  "ip": "192.168.x.x",
  "port": 3000,
  "wsPort": 3000
}
```

## Comandos Úteis

### Verificar se portas estão em uso
```bash
# Linux/Mac
lsof -i :3000
lsof -i :5173

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

### Limpar node_modules e reinstalar
```bash
# Raiz
rm -rf node_modules
npm install

# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd ../frontend
rm -rf node_modules
npm install
```

### Rebuild completo
```bash
# Na raiz do projeto
npm run build
```

## Dicas

1. **Para desenvolvimento local**: Use `npm run dev:backend` e `npm run dev:frontend`
2. **Para compartilhar na rede**: Use `npm run build` e `npm start`
3. **Sempre que modificar o código**: Faça rebuild antes de testar em produção
4. **Para debug**: Abra o console do navegador (F12) e veja os logs do WebSocket
