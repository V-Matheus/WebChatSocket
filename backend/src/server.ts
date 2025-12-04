import * as http from "http";
import { HttpController } from "./controllers/HttpController";
import { WebSocketController } from "./controllers/WebSocketController";
import { NetworkUtils } from "./utils/NetworkUtils";

/**
 * Classe principal do servidor
 * Servidor API + WebSocket (não serve arquivos estáticos)
 */
class Server {
  private server: http.Server;
  private httpController: HttpController;
  private webSocketController: WebSocketController;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;

    this.httpController = new HttpController();
    this.webSocketController = new WebSocketController();

    this.server = this.createServer();
  }

  /**
   * Cria o servidor HTTP
   */
  private createServer(): http.Server {
    const server = http.createServer((req, res) => {
      this.httpController.handleRequest(req, res);
    });

    server.on("upgrade", (req, socket) => {
      this.webSocketController.handleUpgrade(req, socket);
    });

    return server;
  }

  /**
   * Inicia o servidor
   */
  start(): void {
    this.server.listen(this.port, () => {
      const ip = NetworkUtils.getLocalIP();
      console.log(`🚀 Servidor Backend (API + WebSocket)`);
      console.log(`   Local:   http://localhost:${this.port}`);
      console.log(`   Rede:    http://${ip}:${this.port}`);
      console.log(`   WebSocket: ws://${ip}:${this.port}/ws/{roomId}`);
    });
  }

  /**
   * Para o servidor
   */
  stop(): void {
    this.server.close(() => {
      console.log("Servidor encerrado");
    });
  }
}

// Inicia o servidor
const server = new Server(3000);
server.start();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nEncerrando servidor...");
  process.exit(0);
});
