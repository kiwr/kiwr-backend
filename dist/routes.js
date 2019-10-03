"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _express = require('express');
var _ProductController = require('./app/controllers/ProductController'); var _ProductController2 = _interopRequireDefault(_ProductController);

const routes = new (0, _express.Router)();

routes.post('/create', _ProductController2.default.store);
routes.get('/read/:token', _ProductController2.default.read);
routes.get('/readAll', _ProductController2.default.readAll);

exports. default = routes;
