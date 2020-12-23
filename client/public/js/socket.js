class Socket {
  constructor(model_) {
    this.model = model_;
    this.socket = io.connect();

    this.socket.on("created", this.onCreated.bind(this));
    this.socket.on("full", this.onFull.bind(this));
    this.socket.on("join", this.onJoin.bind(this));
    this.socket.on("joined", this.onJoined.bind(this));
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("log", this.onLog.bind(this));
  }

  onCreated(room) {
    this.model.trace("Created room " + room);
  }

  onFull(room) {
    this.model.trace("Room " + room + " is full");
  }

  onJoin(room) {
    this.model.trace("Another peer made a request to join room " + room);
    this.model.trace("This peer is the initiator of room " + room + "!");
    this.model.client.isChannelReady = true;
    if (this.model.localStream) {
      this.model.maybeStart();
    }
  }

  onJoined(room) {
    this.model.trace("joined: " + room);
    this.moedl.client.isChannelReady = true;
    if (this.model.localStream) {
      this.model.maybeStart();
    }
  }

  onMessage(message) {
    this.trace("Client received message:", message);
    if (message === "got user media") {
      this.model.client.maybeStart();
    } else if (message.type === "offer") {
      if (!this.model.client.isInitiator && !this.model.client.isStarted) {
        this.model.client.maybeStart();
      }
      this.model.client.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message)
      );
      this.model.client.doAnswer();
    } else if (message.type === "answer" && this.model.client.isStarted) {
      this.model.client.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message)
      );
    } else if (message.type === "candidate" && this.model.client.isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate,
      });
      this.model.client.peerConnection.addIceCandidate(candidate);
    } else if (message === "bye" && this.model.client.isStarted) {
      this.model.client.handleRemoteHangup();
    }
  }

  onLog(array) {
    this.trace.apply(console, array);
  }
}
