'use strict';

const http = require('http');
const express = require('express');
const morgan = require('morgan');
const app = express();
const service_handler = require('./services/app.js');

const HTTP_PORT = 3030;

app.use('/', service_handler);

let options = {
    requestCert: false, // do not request client certificate
    rejectUnauthorized: false,
};

const server = http.createServer(options, app);
server.listen(HTTP_PORT);
console.log(`Listening HTTP: http://localhost:${HTTP_PORT}`);