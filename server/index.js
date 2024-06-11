const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).substring(2, 15);
  clients.push({ id, ws });

  console.log("New client connected", id);

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === "message") {
      // Broadcast to all clients
      clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      });
    } else if (parsedMessage.type === "setName") {
      clients = clients.map((client) =>
        client.id === id ? { ...client, name: parsedMessage.name } : client
      );
      broadcastUserList();
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected", id);
    clients = clients.filter((client) => client.id !== id);
    broadcastUserList();
  });

  const broadcastUserList = () => {
    const userList = clients.map((client) => client.name || "Anonymous");
    const message = JSON.stringify({ type: "userList", users: userList });
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  };
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});
