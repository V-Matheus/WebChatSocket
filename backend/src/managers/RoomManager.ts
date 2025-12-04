import { Duplex } from "stream";
import { WebSocketService } from "../services/WebSocketService";

/**
 * Gerenciador de salas de chat
 * Implementa o padrão Singleton para gerenciar todas as salas
 */
export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Set<Duplex>>;

  private constructor() {
    this.rooms = new Map();
  }

  /**
   * Obtém a instância única do RoomManager (Singleton)
   */
  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Adiciona um cliente a uma sala
   * @param roomId ID da sala
   * @param socket Socket do cliente
   */
  addClientToRoom(roomId: string, socket: Duplex): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socket);
  }

  /**
   * Remove um cliente de uma sala
   * @param roomId ID da sala
   * @param socket Socket do cliente
   */
  removeClientFromRoom(roomId: string, socket: Duplex): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socket);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Envia uma mensagem para todos os clientes de uma sala, incluindo o remetente
   * @param roomId ID da sala
   * @param message Mensagem a ser enviada
   */
  broadcast(roomId: string, message: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const frame = WebSocketService.encodeFrame(message);

    room.forEach((client) => {
      client.write(frame);
    });
  }

  /**
   * Obtém o número de clientes em uma sala
   * @param roomId ID da sala
   * @returns Número de clientes na sala
   */
  getRoomSize(roomId: string): number {
    return this.rooms.get(roomId)?.size || 0;
  }

  /**
   * Verifica se uma sala existe
   * @param roomId ID da sala
   * @returns true se a sala existe
   */
  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
}
