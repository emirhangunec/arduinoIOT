import WebSocket, { WebSocketServer } from "ws";
import prisma from "../../prisma/prisma";

const wss = new WebSocketServer({ noServer: true });

interface IotWebSocket extends WebSocket {
  id: string | undefined;
  lastPing: number | undefined;
  ip: string | undefined;
}

wss.on("connection", (ws: IotWebSocket, request) => {
  console.log(request.socket.remoteAddress);
  ws.ip = request.socket.remoteAddress;
  ws.on("message", async function message(data, isBinary) {
    const parsedData = data.toString();
    if (parsedData.includes("id:")) {
      ws.id = parsedData.split("id:")[1].trim();
      if (ws.ip === undefined) return;
      const res = await prisma.device.upsert({
        where: {
          id: ws.id,
        },
        update: {
          isOnline: true,
          ip: ws.ip,
        },
        create: {
          id: ws.id,
          ip: ws.ip,
          isOnline: true,
        },
      });
      console.log("res", res);
    }
    if (parsedData === "ping") {
      ws.lastPing = Date.now();
    }
    console.log(`user sended:${parsedData}`);
  });
  ws.on("close", async () => {
    if (ws.id === undefined || ws.ip === undefined) return;
    const res = await prisma.device.update({
      where: {
        id: ws.id,
      },
      data: {
        isOnline: false,
      },
    });
    console.log("res", res);
    console.log("Client disconnected");
  });
});

setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const client = ws as IotWebSocket;
    if (client.readyState !== WebSocket.OPEN) return;
    if (client.lastPing === undefined) return;
    if (client.id === undefined) return;

    console.log(
      client.id,
      new Date(client.lastPing).toLocaleString("tr"),
      client.ip
    );

    if (client.lastPing < Date.now() - 10000) {
      console.log("Client is not responding. Terminating connection.");
      client.terminate();
    }
  });
}, 5000);

export default wss;
