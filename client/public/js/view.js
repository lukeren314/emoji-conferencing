class View {
  constructor() {
    this.model = null;
    this.localVideo = document.getElementById("localVideo");
    this.remoteVideo = document.getElementById("remoteVideo");
    this.startButton = document.getElementById("startButton");
    this.callButton = document.getElementById("callButton");
    this.hangupButton = document.getElementById("hangupButton");
    this.sendBitRate = document.getElementById("send-bitrate");
    this.receiveBitRate = document.getElementById("receive-bit-rate");

    // Set up initial action buttons status: disable call and hangup.
    this.callButton.disabled = true;
    this.hangupButton.disabled = true;

    // Add click event handlers for buttons.
    startButton.addEventListener("click", this.startAction.bind(this));
    callButton.addEventListener("click", this.callAction.bind(this));
    hangupButton.addEventListener("click", this.hangupAction.bind(this));
  }

  setModel(model_) {
    this.model = model_;
  }

  // Handles start button action: creates local MediaStream.
  startAction() {
    startButton.disabled = true;

    this.model.client.getStream();
    this.model.trace("Requesting local stream.");
  }

  // Handles call button action: creates peer connection.
  callAction() {
    this.callButton.disabled = true;
    this.hangupButton.disabled = false;

    this.model.trace("Starting call.");
    //   startTime = window.performance.now();

    // Get local media stream tracks.
    this.model.client.startCall();
  }

  // Handles hangup action: ends up call, closes connections and resets peers.
  hangupAction() {
    this.model.client.hangup();
    this.hangupButton.disabled = true;
    this.callButton.disabled = false;
    this.model.trace("Ending call.");
  }

  setSendBitRate(bps) {
    this.sendBitRate.innerHTML = `Send BitRate: ${(bps / 1000).toFixed(
      3
    )} kbps`;
  }

  setReceiveBitRate(bps) {
    this.receiveBitRate.innerHTML = `Receive BitRate: ${(bps / 1000).toFixed(
      3
    )} kbps`;
  }
}
