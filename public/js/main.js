"use strict";

const model = new Model();
const view = new View();

model.setView(view);
view.setModel(model);

// controller
window.onbeforeunload = function () {
  model.stop();
};

window.setInterval(() => {
  model.tick();
}, 1000);

model.init();
