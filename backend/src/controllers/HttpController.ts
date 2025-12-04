import * as http from "http";
import { NetworkUtils } from "../utils/NetworkUtils";

/**
 * Controlador HTTP para lidar com requisições de API
 * Apenas endpoints de API, sem servir arquivos estáticos
 */
export class HttpController {
  constructor() {}

  /**
   * Processa uma requisição HTTP
   * @param req Requisição HTTP
   * @param res Resposta HTTP
   */
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || "";

    if (url === "/api/server-info") {
      this.handleServerInfo(res);
    } else {
      this.handleNotFound(res);
    }
  }

  /**
   * Retorna informações do servidor (IP e porta)
   */
  private handleServerInfo(res: http.ServerResponse): void {
    const ip = NetworkUtils.getLocalIP();
    const serverInfo = {
      ip: ip,
      port: 3000,
      wsPort: 3000
    };

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify(serverInfo));
  }

  /**
   * Responde com 404 Not Found
   */
  private handleNotFound(res: http.ServerResponse): void {
    res.writeHead(404, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
}
