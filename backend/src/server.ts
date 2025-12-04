import * as http from "http";
import * as path from "path";
import { HttpController } from "./controllers/HttpController";
import { WebSocketController } from "./controllers/WebSocketController";

/**
 * Classe principal do servidor
 * Orquestra os controladores HTTP e WebSocket
 */
class Server {
  private server: http.Server;
  private httpController: HttpController;
  private webSocketController: WebSocketController;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;

    // Caminho para a pasta frontend (um nível acima de backend)
    const frontendPath = path.join(__dirname, "..", "..", "frontend");

    this.httpController = new HttpController(frontendPath);
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
      console.log(`🚀 Servidor rodando em http://localhost:${this.port}`);
      console.log(
        `📁 Servindo arquivos de: ${path.join(
          __dirname,
          "..",
          "..",
          "frontend"
        )}`
      );
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
