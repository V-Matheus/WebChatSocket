import * as crypto from "crypto";
import { Duplex } from "stream";

/**
 * Serviço responsável pela manipulação de WebSocket
 * Implementa o protocolo WebSocket RFC 6455
 */
export class WebSocketService {
  private static readonly WEBSOCKET_GUID =
    "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

  /**
   * Gera o valor de aceite para o handshake WebSocket
   * @param secWebSocketKey A chave fornecida pelo cliente
   * @returns O valor de aceite codificado em base64
   */
  static generateAcceptValue(secWebSocketKey: string): string {
    return crypto
      .createHash("sha1")
      .update(secWebSocketKey + this.WEBSOCKET_GUID, "binary")
      .digest("base64");
  }

  /**
   * Realiza o handshake WebSocket com o cliente
   * @param socket O socket do cliente
   * @param key A chave WebSocket do cabeçalho
   */
  static performHandshake(socket: Duplex, key: string): void {
    const acceptKey = this.generateAcceptValue(key);
    socket.write(
      "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
        "\r\n"
    );
  }

  /**
   * Decodifica um frame WebSocket (suporta apenas texto sem fragmentação)
   * @param data Buffer contendo o frame
   * @returns A mensagem decodificada
   */
  static decodeFrame(data: Buffer): string {
    const secondByte = data[1];
    const length = secondByte & 127;

    let maskStart = 2;
    if (length === 126) maskStart = 4;
    if (length === 127) maskStart = 10;

    const masks = data.slice(maskStart, maskStart + 4);
    const payload = data.slice(maskStart + 4);

    let msg = "";
    for (let i = 0; i < payload.length; ++i) {
      msg += String.fromCharCode(payload[i] ^ masks[i % 4]);
    }

    return msg;
  }

  /**
   * Codifica uma string em um frame WebSocket (apenas texto sem fragmentação)
   * @param str A string a ser codificada
   * @returns Buffer contendo o frame WebSocket
   */
  static encodeFrame(str: string): Buffer {
    const payload = Buffer.from(str);
    const frame: number[] = [0x81]; // FIN bit + opcode text

    if (payload.length < 126) {
      frame.push(payload.length);
    } else if (payload.length < 65536) {
      frame.push(126, payload.length >> 8, payload.length & 0xff);
    } else {
      throw new Error("Payload muito grande");
    }

    return Buffer.concat([Buffer.from(frame), payload]);
  }
}
