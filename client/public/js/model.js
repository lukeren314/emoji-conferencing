const DEBUG = true;

class Model {
  constructor() {
    this.client = new Client(this);
    this.socket = new Socket(this);
    this.view = null;
  }

  setView(view_) {
    this.view = view_;
  }

  init() {
    this.trace("Getting user media with constraints", mediaStreamConstraints);

    if (location.hostname !== "localhost") {
      requestTurn();
    }
  }

  stop() {
    this.client.stop();
  }

  // Logs an action (text) and the time when it happened on the console.
  trace(...args) {
    if (DEBUG) {
      let callStack = new Error().stack.split("\n");
      var callerLine = callStack[callStack.length - 2];
      console.log(...args, callerLine);
    }
  }

  tick() {
    this.client.tick();
  }
}
