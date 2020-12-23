class Socket {
  constructor(socket_, io_, secure) {
    this.socket = socket_;
    this.io = io_;
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("create-join", this.onCreateJoin.bind(this));
    this.socket.on("ipaddr", this.onIpAddr.bind(this));
    this.socket.on("close", this.onClose.bind(this));
  }

  log() {
    var array = ["Message from server:"];
    array.push.apply(array, arguments);
    this.socket.emit("log", array);
  }

  broadcast(...args) {
    this.socket.broadcast.emit(...args);
  }

  emit(...args) {
    this.socket.emit(...args);
  }

  joinRoom(room_) {
    this.room = room_;
    this.socket.join(this.room);
  }

  roomEmit(...args) {
    this.io.sockets.in(this.room).emit(...args);
  }

  // ------------------------------ CONNECTIONS -------------------------------

  onMessage(message) {
    this.log("Client said: ", message);
    // for a real app, would be room-only (not broadcast)
    this.broadcast("message", message);
  }

  onCreateJoin(room) {
    this.log("Received request to create or join room " + room);

    var clientsInRoom = this.io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom
      ? Object.keys(clientsInRoom.sockets).length
      : 0;
    this.log("Room " + room + " now has " + numClients + " client(s)");

    if (numClients === 0) {
      this.joinRoom(room);
      this.log("Client ID " + this.socket.id + " created room " + room);
      this.emit("created", room, this.socket.id);
    } else if (numClients === 1) {
      this.log("Client ID " + this.socket.id + " joined room " + room);
      this.roomEmit("join", room);
      this.joinRoom(room);
      this.emit("joined", room, this.socket.id);
      this.roomEmit("ready");
    } else {
      // max two clients
      this.emit("full", room);
    }
  }

  onIpAddr() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function (details) {
        if (details.family === "IPv4" && details.address !== "127.0.0.1") {
          this.emit("ipaddr", details.address);
        }
      });
    }
  }

  onClose() {
    this.log("received bye");
  }
}

module.exports = Socket;
