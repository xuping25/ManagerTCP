import { useAppStore } from '@/store'

class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectTimer = null
    this.reconnectInterval = 5000
    this.url = `ws://${window.location.hostname}:3001`
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        const store = useAppStore()
        store.setWsConnected(true)

        // 发送心跳
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        const store = useAppStore()
        store.setWsConnected(false)

        // 停止心跳
        this.stopHeartbeat()

        // 尝试重连
        this.reconnect()
      }
    } catch (error) {
      console.error('WebSocket connect error:', error)
      this.reconnect()
    }
  }

  handleMessage(message) {
    const store = useAppStore()

    switch (message.type) {
      case 'connected':
        console.log('Connected to server:', message.message)
        break

      case 'realtime_data':
        store.updateRealtimeData(message.data)
        break

      case 'alarm':
        store.addAlarm(message.data)
        break

      case 'pong':
        // 心跳响应
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  reconnect() {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectInterval)
  }

  disconnect() {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export default new WebSocketClient()
