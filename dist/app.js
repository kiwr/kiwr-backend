"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _express = require('express'); var _express2 = _interopRequireDefault(_express);
var _routes = require('./routes'); var _routes2 = _interopRequireDefault(_routes);
var _cors = require('cors'); var _cors2 = _interopRequireDefault(_cors);
var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);
var _dotenv = require('dotenv'); var _dotenv2 = _interopRequireDefault(_dotenv);

class App {
  constructor() {
    _dotenv2.default.config();
    this.server = _express2.default.call(void 0, );
    this.middlewares();
    this.routes();
    this.server.use(_cors2.default.call(void 0, ));
    this.connect();
  }

  middlewares() {
    this.server.use(_express2.default.json());
  }

  routes() {
    this.server.use(_routes2.default);
  }

  connect() {
    _mongoose2.default
      .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .catch(err => console.log(err));
  }
}

exports. default = new App().server;
