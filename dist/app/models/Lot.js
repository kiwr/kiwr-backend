"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);
var _Product = require('./Product'); var _Product2 = _interopRequireDefault(_Product);

let ProductSchema = _mongoose2.default.model('Product').schema;

const LotSchema = new _mongoose2.default.Schema(
  {
    lot: {
      required: [true, 'Lot not informed'],
      type: String,
    },
    products: Array,
  },
  {
    collection: 'lots',
  }
);

exports. default = _mongoose2.default.model('Lots', LotSchema);
