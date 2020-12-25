const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("sslcert/server.key"),
  cert: fs.readFileSync("sslcert/server.cert"),
  rejectUnauthorized: false,
};
https
  .createServer(options, (req, res) => {
    console.log("request received");
    res.writeHead(200);
    res.end("hello");
  })
  .listen(8443)
  .on("error", (error) => {
    throw error;
  });
