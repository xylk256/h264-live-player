"use strict";

const http = require('http');
const express = require('express');


const WebStreamerServer = require('./lib/raspivid');

const app = express();

const server = http.createServer(app);
const silence = new WebStreamerServer(server);

server.listen(8080);
