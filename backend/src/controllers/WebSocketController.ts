import * as http from "http";
import { Duplex } from "stream";
import { WebSocketService } from "../services/WebSocketService";
import { RoomManager } from "../managers/RoomManager";

/**
 * Controlador WebSocket para lidar com conexões WebSocket
 * Implementa o padrão Controller para separar a lógica de WebSocket
 */
export class WebSocketController {
  private roomManager: RoomManager;

  constructor() {
    this.roomManager = RoomManager.getInstance();
  }

  /**
   * Processa uma requisição de upgrade para WebSocket
   * @param req Requisição HTTP
   * @param socket Socket do cliente
   */
  handleUpgrade(req: http.IncomingMessage, socket: Duplex): void {
    const url = req.url || "";
    const roomId = this.extractRoomId(url);

    if (!roomId) {
      socket.destroy();
      return;
    }

    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }

    // Realiza o handshake WebSocket
    WebSocketService.performHandshake(socket, key);

    // Adiciona o cliente à sala
    this.roomManager.addClientToRoom(roomId, socket);

    // Configura os event handlers
    this.setupSocketHandlers(socket, roomId);
  }

  /**
   * Extrai o ID da sala da URL
   * @param url URL da requisição
   * @returns ID da sala ou null se inválido
   */
  private extractRoomId(url: string): string | null {
    const match = url.match(/^\/ws\/(.+)$/);
    return match ? match[1] : null;
  }

  /**
   * Configura os manipuladores de eventos do socket
   * @param socket Socket do cliente
   * @param roomId ID da sala
   */
  private setupSocketHandlers(socket: Duplex, roomId: string): void {
    socket.on("data", (buffer: Buffer) => {
      this.handleData(socket, buffer, roomId);
    });

    socket.on("close", () => {
      this.handleDisconnect(socket, roomId);
    });

    socket.on("end", () => {
      this.handleDisconnect(socket, roomId);
    });

    socket.on("error", (error: Error) => {
      console.error("Erro no socket:", error);
      this.handleDisconnect(socket, roomId);
    });
  }

  /**
   * Processa dados recebidos do cliente
   * @param socket Socket do cliente
   * @param buffer Buffer de dados
   * @param roomId ID da sala
   */
  private handleData(socket: Duplex, buffer: Buffer, roomId: string): void {
    try {
      const message = WebSocketService.decodeFrame(buffer);
      if (message) {
        this.roomManager.broadcast(roomId, message);
      }
    } catch (error) {
      console.error("Erro ao decodificar frame:", error);
    }
  }

  /**
   * Processa a desconexão de um cliente
   * @param socket Socket do cliente
   * @param roomId ID da sala
   */
  private handleDisconnect(socket: Duplex, roomId: string): void {
    this.roomManager.removeClientFromRoom(roomId, socket);
  }
}
