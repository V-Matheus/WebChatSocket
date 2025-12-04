import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './WelcomeScreen.css'

function WelcomeScreen({ onJoin, roomId }) {
  const [name, setName] = useState('')
  const [serverInfo, setServerInfo] = useState(null)

  useEffect(() => {
    // Buscar informações do servidor (IP e porta)
    fetch('/api/server-info')
      .then(res => res.json())
      .then(data => {
        console.log('Informações do servidor:', data)
        setServerInfo(data)
      })
      .catch(err => {
        console.error('Erro ao buscar informações do servidor:', err)
        // Fallback para o IP atual
        setServerInfo({
          ip: window.location.hostname,
          port: window.location.port || 5173
        })
      })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onJoin(name.trim())
    }
  }

  const getRoomUrl = () => {
    if (!serverInfo) {
      // Enquanto não carrega, usar o hostname atual
      const hostname = window.location.hostname || 'localhost'
      const port = window.location.port ? `:${window.location.port}` : ':5173'
      return `http://${hostname}${port}/room/${roomId}`
    }

    // Usar o IP do servidor para que funcione na rede local
    return `http://${serverInfo.ip}:${serverInfo.port}/room/${roomId}`
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-header">
          <div className="icon">💬</div>
          <h1>WebChat</h1>
          <p>Chat em tempo real com WebSocket</p>
        </div>

        <div className="qr-section">
          <h2>Compartilhe este QR Code</h2>
          <p className="qr-description">
            Escaneie para entrar na sala de chat
          </p>
          <div className="qr-container">
            <QRCodeSVG
              value={getRoomUrl()}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="room-info">
            <p className="room-id">Sala: <strong>{roomId}</strong></p>
            {serverInfo && (
              <p className="server-ip">
                🌐 IP da Rede: <strong>{serverInfo.ip}</strong>
              </p>
            )}
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(getRoomUrl())
                alert('Link copiado!')
              }}
            >
              📋 Copiar Link
            </button>
          </div>
        </div>

        <form className="name-form" onSubmit={handleSubmit}>
          <h2>Digite seu nome</h2>
          <input
            type="text"
            placeholder="Seu nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <button type="submit" disabled={!name.trim()}>
            Entrar no Chat
          </button>
        </form>
      </div>
    </div>
  )
}

export default WelcomeScreen
