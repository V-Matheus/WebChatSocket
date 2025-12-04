import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { RoomIdGenerator } from "../utils/RoomIdGenerator";
import { NetworkUtils } from "../utils/NetworkUtils";

/**
 * Controlador HTTP para lidar com requisições HTTP
 * Segue o padrão Controller para separar a lógica de roteamento
 */
export class HttpController {
  private frontendPath: string;

  constructor(frontendPath: string) {
    this.frontendPath = frontendPath;
  }

  /**
   * Processa uma requisição HTTP
   * @param req Requisição HTTP
   * @param res Resposta HTTP
   */
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || "";

    if (url === "/") {
      this.handleRoot(res);
    } else if (url.startsWith("/room/")) {
      this.handleRoom(res);
    } else if (url === "/qrcode.min.js") {
      this.handleQRCodeScript(res);
    } else {
      this.handleNotFound(res);
    }
  }

  /**
   * Redireciona para uma nova sala
   */
  private handleRoot(res: http.ServerResponse): void {
    const roomId = RoomIdGenerator.generate();
    res.writeHead(302, { Location: `/room/${roomId}` });
    res.end();
  }

  /**
   * Serve a página HTML da sala
   */
  private handleRoom(res: http.ServerResponse): void {
    const indexPath = path.join(this.frontendPath, "index.html");

    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Erro interno do servidor");
        return;
      }

      const ip = NetworkUtils.getLocalIP();
      let html = data.toString();
      html = html.replace("__SERVER_IP__", ip);

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
  }

  /**
   * Serve o script do QR Code
   */
  private handleQRCodeScript(res: http.ServerResponse): void {
    const qrcodePath = path.join(this.frontendPath, "qrcode.min.js");

    fs.readFile(qrcodePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Arquivo não encontrado");
        return;
      }

      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    });
  }

  /**
   * Responde com 404 Not Found
   */
  private handleNotFound(res: http.ServerResponse): void {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Não encontrado");
  }
}
