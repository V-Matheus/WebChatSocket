import { useState, useEffect } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import ChatRoom from './components/ChatRoom'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isInChat, setIsInChat] = useState(false)

  useEffect(() => {
    // Extrair roomId da URL
    const path = window.location.pathname
    const match = path.match(/\/room\/(.+)$/)
    if (match) {
      setRoomId(match[1])
    } else {
      // Se não houver roomId na URL, gerar um novo
      const newRoomId = generateRoomId()
      setRoomId(newRoomId)
      window.history.pushState({}, '', `/room/${newRoomId}`)
    }
  }, [])

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const handleJoinChat = (name) => {
    setUsername(name)
    setIsInChat(true)
  }

  if (!roomId) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="app">
      {!isInChat ? (
        <WelcomeScreen onJoin={handleJoinChat} roomId={roomId} />
      ) : (
        <ChatRoom username={username} roomId={roomId} />
      )}
    </div>
  )
}

export default App
