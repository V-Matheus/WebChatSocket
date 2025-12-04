import * as os from "os";

/**
 * Utilitário para obter informações de rede
 */
export class NetworkUtils {
  /**
   * Obtém o endereço IP local da máquina
   * @returns O endereço IP local ou 'localhost' se não encontrado
   */
  static getLocalIP(): string {
    const interfaces = os.networkInterfaces();

    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;

      for (const i of iface) {
        if (i.family === "IPv4" && !i.internal) {
          return i.address;
        }
      }
    }

    return "localhost";
  }
}
