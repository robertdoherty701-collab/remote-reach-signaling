# Remote Reach Signaling Server

Servidor de sinalização WebRTC para o aplicativo Remote Reach.

## Deploy no Render (Grátis)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Deploy Manual:

1. Fork este repositório
2. Acesse [render.com](https://render.com)
3. Clique em "New" → "Web Service"
4. Conecte seu repositório
5. Configure:
   - **Name**: `remote-reach-signaling`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Clique em "Create Web Service"

## Rodar Localmente

```bash
npm install
npm start
```

O servidor estará disponível em `http://localhost:3001`

## Endpoints

- `GET /` - Status do servidor
- `GET /health` - Health check

## WebSocket Events

### Cliente → Servidor
- `register` - Registrar dispositivo
- `connect-request` - Solicitar conexão
- `accept-connection` - Aceitar conexão
- `reject-connection` - Recusar conexão
- `signal` - Sinalização WebRTC

### Servidor → Cliente
- `incoming-connection` - Conexão entrante
- `connection-accepted` - Conexão aceita
- `connection-rejected` - Conexão recusada
- `signal` - Sinalização WebRTC
- `peer-disconnected` - Peer desconectado
