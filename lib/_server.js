"use strict";


const WebSocketServer = require('ws').Server;
const Splitter = require('stream-split');
const merge = require('mout/object/merge');

const NALseparator = new Buffer([0, 0, 0, 1]);//NAL break

var i2cBus = require("i2c-bus");
var Pca9685Driver = require("pca9685").Pca9685Driver;

var options = {
  i2c: i2cBus.openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false
};

const map = (x, in_min, in_max, out_min, out_max) => {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

pwm = new Pca9685Driver(options, function (err) {
  if (err) {
    console.error("Error initializing PCA9685");
    process.exit(-1);
  }
  console.log("Initialization done");
});

class _Server {

  constructor(server, options) {

    this.options = merge({
      width: 960,
      height: 540,
    }, options);

    this.wss = new WebSocketServer({ server });

    this.new_client = this.new_client.bind(this);
    this.start_feed = this.start_feed.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.close_stream = this.close_stream.bind(this);

    this.wss.on('connection', this.new_client);
  }


  start_feed() {
    var readStream = this.get_feed();
    this.readStream = readStream;

    readStream = readStream.pipe(new Splitter(NALseparator));
    readStream.on("data", this.broadcast);
  }

  get_feed() {
    throw new Error("to be implemented");
  }

  close_stream() {
    throw new Error("to be implemented");
  }

  broadcast(data) {
    this.wss.clients.forEach(function (socket) {

      if (socket.buzy)
        return;

      socket.buzy = true;
      socket.buzy = false;

      socket.send(Buffer.concat([NALseparator, data]), { binary: true }, function ack(error) {
        socket.buzy = false;
      });
    });
  }

  new_client(socket) {

    var self = this;
    console.log('New guy');

    socket.send(JSON.stringify({
      action: "init",
      width: this.options.width,
      height: this.options.height,
    }));

    socket.on("message", function (data) {
      console.log(data);

      const action = data.split(' ')[0];

      if (action == "REQUESTSTREAM") {
        self.start_feed();
        return;
      }

      if (action == "STOPSTREAM") {
        self.close_stream();
        return;
      }

      try {
        const d = JSON.parse(data);

        switch (d.topic) {
          case 'controller':
            // console.log(d.data);

            if (pwm) {
              pwm.setPulseLength(d.data.l2, 0, 1, 1500, 1700);
            }
        }
      } catch (err) {
        // Nic
      }

    });

    socket.on('close', function () {
      if (self.readStream) {
        self.readStream.end();
      }

      self.close_stream();
      console.log('stopping client interval');
    });
  }


};


module.exports = _Server;
