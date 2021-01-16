const peerConnectionConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "turn:turn.xxx.xxx.xxx.xxx:3478",
      username: "test",
      password: "test",
    },
  ],
};

// Set up audio and video regardless of what devices are present.
const sdpeerConnectiononstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

const mediaStreamConstraints = {
  video: true,
  audio: false,
};

class Client {
  constructor(model_) {
    this.model = model_;
    this.isChannelReady = false;
    this.isInitiator = false;
    this.isStarted = false;
    this.localStream = null;
    this.peerConnection = null;
    this.remoteStream = null;
    this.turnReady = null;
    this.room = "foo";
    this.isVideo = true;

    this.lastSendResult = null;
    this.lastReceiveResult = null;
  }

  startCall() {
    const videoTracks = this.localStream.getVideoTracks();
    const audioTracks = this.localStream.getAudioTracks();
    if (videoTracks.length > 0) {
      this.model.trace(`Using video device: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
      this.model.trace(`Using audio device: ${audioTracks[0].label}.`);
    }

    if (this.room !== "") {
      this.model.socket.emit("create-join", this.room);
      this.model.trace("Attempted to create or  join room", this.room);
    }
  }

  switchModes() {
    if (this.isVideo) {
      this.localStream.getVideoTracks()[0].enabled = false;
      this.isVideo = false;
    } else {
      this.localStream.getVideoTracks()[0].enabled = true;
      this.isVideo = true;
    }
  }

  ////////////////////////////////////////////////
  ////////////////////////////////////////////////

  sendMessage(message) {
    this.model.trace("Client sending message: ", message);
    this.model.socket.emit("message", message);
  }

  getStream() {
    console.log(mediaStreamConstraints);
    let callback = this.gotStream.bind(this);
    let callback2 = this.gotStreamFailed.bind(this);
    navigator.mediaDevices
      .getUserMedia(mediaStreamConstraints)
      .then(callback)
      .catch(function (e) {
        console.log("getUserMedia() error: ", e);
        gotStreamFailed();
      });
  }

  gotStream(stream) {
    this.localStream = stream;
    this.model.view.localVideo.srcObject = stream;
    this.model.view.callButton.disabled = false; // Enable call button.
    this.model.view.startButton.disabled = true;

    this.sendMessage("got user media");
  }

  gotStreamFailed(stream) {
    this.localStream = MediaStream();
    this.model.view.localVideo.srcObject = stream;
    this.model.view.callButton.disabled = false; // Enable call button.
    this.model.view.startButton.disabled = true;
  }

  maybeStart() {
    this.model.trace(
      ">>>>>>> maybeStart() ",
      this.isStarted,
      this.localStream,
      this.isChannelReady
    );
    if (
      !this.isStarted &&
      typeof this.localStream !== "undefined" &&
      this.isChannelReady
    ) {
      this.model.trace(">>>>>> creating peer connection");
      this.createPeerConnection();
      this.peerConnection.addStream(this.localStream);
      this.isStarted = true;
      this.model.trace("isInitiator", this.isInitiator);
      if (this.isInitiator) {
        this.doCall();
      }

      this.model.view.callButton.disabled = true;
      this.model.view.hangupButton.disabled = false;
      this.model.view.switchButton.disabled = false;
    }
  }

  /////////////////////////////////////////////////////////

  createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
      this.peerConnection.onicecandidate = this.handleIceCandidate.bind(this);
      this.peerConnection.ontrack = this.handleRemoteStreamAdded.bind(this);
      this.peerConnection.onremovestream = this.handleRemoteStreamRemoved.bind(
        this
      );
      this.model.trace("Created RTCPeerConnnection");
    } catch (e) {
      this.model.trace(
        "Failed to create PeerConnection, exception: " + e.message
      );
      alert("Cannot create RTCPeerConnection object.");
      return;
    }
  }

  handleIceCandidate(event) {
    this.model.trace("icecandidate event: ", event);
    if (event.candidate) {
      this.sendMessage({
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    } else {
      this.model.trace("End of candidates.");
    }
  }

  handleCreateOfferError(event) {
    this.model.trace("createOffer() error: ", event);
  }

  doCall() {
    this.model.trace("Sending offer to peer");
    let callback1 = this.setLocalAndSendMessage.bind(this);
    let callback2 = this.handleCreateOfferError.bind(this);
    this.peerConnection.createOffer(callback1, callback2);
  }

  doAnswer() {
    this.model.trace("Sending answer to peer.");
    let callback1 = this.setLocalAndSendMessage.bind(this);
    let callback2 = this.onCreateSessionDescriptionError.bind(this);
    this.peerConnection.createAnswer().then(callback1, callback2);
  }

  setLocalAndSendMessage(sessionDescription) {
    this.peerConnection.setLocalDescription(sessionDescription);
    this.model.trace(
      "setLocalAndSendMessage sending message",
      sessionDescription
    );
    this.sendMessage(sessionDescription);
  }

  onCreateSessionDescriptionError(error) {
    this.model.trace(
      "Failed to create session description: " + error.toString()
    );
  }

  requestTurn() {
    var turnExists = false;
    for (var i in peerConnectionConfig.iceServers) {
      if (peerConnectionConfig.iceServers[i].urls.substr(0, 5) === "turn:") {
        turnExists = true;
        this.turnReady = true;
        break;
      }
    }
    if (!turnExists) {
      this.model.trace("no turn server found");
      this.trace("Getting TURN server from ", turnURL);
      // No TURN server. Get one from computeengineondemand.appspot.com:
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var turnServer = JSON.parse(xhr.responseText);
          this.trace("Got TURN server: ", turnServer);
          peerConnectionConfig.iceServers.push({
            urls: "turn:" + turnServer.username + "@" + turnServer.turn,
            credential: turnServer.password,
          });
          turnReady = true;
        }
      };
      xhr.open("GET", turnURL, true);
      xhr.send();
    }
  }

  handleRemoteStreamAdded(event) {
    this.model.trace("Remote stream added.");
    this.remoteStream = event.streams[0];
    this.model.view.remoteVideo.srcObject = this.remoteStream;
  }

  handleRemoteStreamRemoved(event) {
    this.model.trace("Remote stream removed. Event: ", event);
  }

  hangup() {
    this.model.trace("Hanging up.");
    this.stop();
    this.model.socket.emit("close");
    // this.sendMessage("close");
  }

  handleRemoteHangup() {
    this.model.trace("Session terminated.");
    this.stop();
    this.isInitiator = false;
  }

  stop() {
    this.isStarted = false;
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.peerConnection = null;
  }

  tick() {
    if (!this.peerConnection) {
      return;
    }

    const receiver = this.peerConnection;
    const sender = this.peerConnection.getSenders()[0];

    let receiveCallback = (this.isVideo
      ? this.model.view.setReceiveBitRate
      : this.model.view.setAnimatedReceiveBitRate
    ).bind(this.model.view);

    receiver.getStats().then((res) => {
      res.forEach((report) => {
        let bytes;
        if (report.type === "inbound-rtp") {
          if (report.isRemote) {
            return;
          }
          let now = report.timestamp;
          bytes = report.bytesReceived;

          if (this.lastReceiveResult && this.lastReceiveResult.has(report.id)) {
            let deltaT = now - this.lastReceiveResult.get(report.id).timestamp;
            // calculate bitrate
            let bitrate =
              (8 *
                (bytes - this.lastReceiveResult.get(report.id).bytesReceived)) /
              deltaT;
            receiveCallback(bitrate);
          }
        }
      });
      this.lastReceiveResult = res;
    });

    let sendCallback = (this.isVideo
      ? this.model.view.setSendBitRate
      : this.model.view.setAnimatedSendBitRate
    ).bind(this.model.view);
    sender.getStats().then((res) => {
      res.forEach((report) => {
        let bytes;
        if (report.type === "outbound-rtp") {
          if (report.isRemote) {
            return;
          }
          let now = report.timestamp;
          bytes = report.bytesSent;

          if (this.lastSendResult && this.lastSendResult.has(report.id)) {
            let deltaT = now - this.lastSendResult.get(report.id).timestamp;
            // calculate bitrate
            let bitrate =
              (8 * (bytes - this.lastSendResult.get(report.id).bytesSent)) /
              deltaT;
            sendCallback(bitrate);
          }
        }
      });
      this.lastSendResult = res;
    });
  }
}
