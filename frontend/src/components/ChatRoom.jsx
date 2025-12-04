import { useState, useEffect, useRef } from 'react'
import './ChatRoom.css'

function ChatRoom({ username, roomId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [ws, setWs] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const userColorsRef = useRef({})

  // Função para gerar cor única baseada no nome
  const getUserColor = (name) => {
    if (userColorsRef.current[name]) {
      return userColorsRef.current[name]
    }

    // Paleta de cores inspirada no WhatsApp
    const colors = [
      '#1DA1F2', // Azul
      '#E4405F', // Rosa
      '#7B68EE', // Roxo
      '#FF6347', // Vermelho
      '#20B2AA', // Turquesa
      '#FF8C00', // Laranja
      '#32CD32', // Verde
      '#9370DB', // Lilás
      '#DC143C', // Carmesim
      '#00CED1', // Ciano
      '#FF1493', // Rosa Escuro
      '#4169E1', // Azul Royal
    ]

    // Usar hash do nome para selecionar cor consistente
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colorIndex = Math.abs(hash) % colors.length
    const color = colors[colorIndex]

    userColorsRef.current[name] = color
    return color
  }

  useEffect(() => {
    // Conectar ao WebSocket
    const wsUrl = `ws://${window.location.hostname}:3000/ws/${roomId}`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('Conectado ao WebSocket')
      setIsConnected(true)
      // Enviar mensagem de entrada
      const joinMessage = {
        type: 'join',
        username: username,
        timestamp: new Date().toISOString()
      }
      websocket.send(JSON.stringify(joinMessage))
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'join') {
          // Mensagem de sistema quando alguém entra
          setMessages(prev => [...prev, {
            type: 'system',
            text: `${data.username} entrou no chat`,
            timestamp: data.timestamp
          }])
        } else if (data.type === 'message') {
          // Mensagem normal de chat
          setMessages(prev => [...prev, {
            type: 'message',
            username: data.username,
            text: data.text,
            timestamp: data.timestamp,
            isOwn: data.username === username
          }])
        }
      } catch (e) {
        // Se não for JSON, é mensagem do sistema antigo
        console.log('Mensagem recebida:', event.data)
      }
    }

    websocket.onerror = (error) => {
      console.error('Erro no WebSocket:', error)
      setIsConnected(false)
    }

    websocket.onclose = () => {
      console.log('Desconectado do WebSocket')
      setIsConnected(false)
    }

    setWs(websocket)

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close()
      }
    }
  }, [roomId, username])

  useEffect(() => {
    // Auto-scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        username: username,
        text: inputMessage.trim(),
        timestamp: new Date().toISOString()
      }

      ws.send(JSON.stringify(message))
      setInputMessage('')
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="header-content">
          <div className="room-icon">💬</div>
          <div className="room-info">
            <h2>Sala: {roomId}</h2>
            <p className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● Online' : '○ Desconectado'}
            </p>
          </div>
        </div>
        <div className="user-badge">
          <span>👤 {username}</span>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="no-messages">
            <p>Nenhuma mensagem ainda</p>
            <p>Seja o primeiro a enviar uma mensagem!</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index}>
            {msg.type === 'system' ? (
              <div className="system-message">
                <span>{msg.text}</span>
              </div>
            ) : (
              <div className={`message ${msg.isOwn ? 'own' : 'other'}`}>
                {!msg.isOwn && (
                  <div
                    className="message-username"
                    style={{ color: getUserColor(msg.username) }}
                  >
                    {msg.username}
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={!isConnected}
        />
        <button type="submit" disabled={!inputMessage.trim() || !isConnected}>
          ➤
        </button>
      </form>
    </div>
  )
}

export default ChatRoom
