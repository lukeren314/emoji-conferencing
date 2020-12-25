const DEBUG = true;

class Model {
  constructor() {
    this.client = new Client(this);
    this.socket = new ClientSocket(this);
    this.view = null;
  }

  setView(view_) {
    this.view = view_;
  }

  init() {
    this.trace("Getting user media with constraints", mediaStreamConstraints);

    if (location.hostname !== "localhost") {
      this.client.requestTurn();
    }
  }

  stop() {
    this.client.stop();
  }

  // Logs an action (text) and the time when it happened on the console.
  trace(...args) {
    if (DEBUG) {
      if (args.includes("-verbose")) {
        let callStack = new Error().stack.split("\n");
        // var callerLine = callStack[callStack.length - 2];
        console.log(...args);
      } else {
        console.log(...args);
      }
    }
  }

  tick() {
    this.client.tick();
  }
}
