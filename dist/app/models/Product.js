"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);

const ProductSchema = new _mongoose2.default.Schema(
  {
    name: {
      required: [true, 'Name not informed'],
      type: String,
    },
    desc: String,
    lot: {
      required: [true, 'Lot not informed'],
      type: String,
    },
    serialNumber: {
      required: [true, 'Serial number not informed'],
      type: String,
    },
    flag: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'products',
  }
);

exports. default = _mongoose2.default.model('Product', ProductSchema);
