"use strict";

const util = require('util');
const spawn = require('child_process').spawn;
const merge = require('mout/object/merge');

const Server = require('./_server');


class RpiServer extends Server {

  stream = null;
  proc = null;

  constructor(server, opts) {
    super(server, merge({
      fps: 12,
    }, opts));
  }



  get_feed() {
    if (this.stream) {
      return this.stream;
    }

    const self = this;

    this.proc = spawn('raspivid', ['-t', '0', '-vf', '-hf', '-o', '-', '-w', this.options.width, '-h', this.options.height, '-fps', this.options.fps, '-pf', 'baseline']);
    this.proc.on("exit", function (code) {
      self.proc = null;
      self.stream = null;
      console.log("Failure", code);
    });

    this.stream = this.proc.stdout;

    return this.proc.stdout;
  }

  close_stream() {
    this.proc.kill();
  }

};



module.exports = RpiServer;
