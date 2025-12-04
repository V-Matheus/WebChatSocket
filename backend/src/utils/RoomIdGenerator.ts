import * as crypto from "crypto";

/**
 * Gerador de IDs únicos para salas de chat
 */
export class RoomIdGenerator {
  /**
   * Gera um ID único para uma sala usando bytes aleatórios
   * @param length Número de bytes aleatórios (padrão: 4)
   * @returns ID da sala em formato hexadecimal
   */
  static generate(length: number = 4): string {
    return crypto.randomBytes(length).toString("hex");
  }
}
