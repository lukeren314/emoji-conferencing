"use-strict";

// modules
const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const socket = require("socket.io");

const Socket = require("./socket.js");

// constants
const httpPort = 8080;
const httpsPort = 8443;

// grab credentials
const credentials = {
  key: fs.readFileSync("sslcert/server.key", "utf8"),
  cert: fs.readFileSync("sslcert/server.cert", "utf8"),
};

// create servers and sockets
const app = express();
// app.use(cors());
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const io = socket(httpServer);
const ios = socket(httpsServer);

app.use(express.static("client/public"));

console.log(
  `Listening on http://localhost:${httpPort}, and https://localhost:${httpsPort}`
);

httpServer.listen(httpPort);
httpsServer.listen(httpsPort);

// ------------------------------- CONNECTIONS --------------------------------

io.on("connection", (socket) => {
  console.log("connected unsecure");
  new Socket(socket, io, false);
});

ios.on("connection", function (socket) {
  console.log("connected");
  new Socket(socket, ios, true);
});
