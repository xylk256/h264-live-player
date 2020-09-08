"use strict";

const http = require('http');
const express = require('express');


const WebStreamerServer = require('./lib/raspivid');

const app = express();

const server = http.createServer(app);
const silence = new WebStreamerServer(server, { fps: 30, width: 480, height: 360 });

server.listen(8080);
