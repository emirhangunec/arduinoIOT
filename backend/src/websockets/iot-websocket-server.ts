import WebSocket, { WebSocketServer } from "ws";
import prisma from "../../prisma/prisma";
import eventHandler from "../events";

const wss = new WebSocketServer({ noServer: true });

interface IotWebSocket extends WebSocket {
  id: string | undefined;
  lastPing: number | undefined;
  ip: string | undefined;
  window: boolean | undefined;
}

wss.on("connection", (ws: IotWebSocket, request) => {
  ws.ip = request.socket.remoteAddress;
  ws.on("message", async function message(data, isBinary) {
    const parsedData = data.toString();
    const [key, value] = parsedData.split(":");
    switch (key) {
      case "id":
        ws.id = value;
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
        eventHandler.emit("device-online", res);
        break;
      case "ping":
        ws.lastPing = Date.now();
        break;

      case "window":
        ws.window = parseInt(value) === 1;
        break;
      default:
        console.log(`user sended:${parsedData}`);
        break;
    }
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

    if (client.lastPing < Date.now() - 30000) {
      console.log("Client is not responding. Terminating connection.");
      client.terminate();
      return;
    }

    const data = {
      id: client.id,
      ip: client.ip,
      lastPing: client.lastPing,
      isWindowClosed: client.window,
    };
    console.log(data);
    const isRelayOpen = Math.random() > 0.5;
    const isHeatingOpen = Math.random() > 0.5;

    client.send(
      `relay:${isRelayOpen ? 1 : 0},heating:${isHeatingOpen ? 1 : 0}`
    );
    console.log(
      "sended: ",
      `relay:${isRelayOpen ? 1 : 0},heating:${isHeatingOpen ? 1 : 0}`
    );
  });
}, 5000);

export default wss;
