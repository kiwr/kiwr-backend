"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _yup = require('yup'); var Yup = _interopRequireWildcard(_yup);
var _v1 = require('uuid/v1'); var _v12 = _interopRequireDefault(_v1);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _util = require('util');

var _Product = require('../models/Product'); var _Product2 = _interopRequireDefault(_Product);

class ProductController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      desc: Yup.string(),
      lot: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Validation error' });
    }

    const { name, desc, lot } = req.body;

    const lotExists = await _Product2.default.find({ lot: lot });

    if (lotExists.length !== 0) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Lot already exists' });
    }

    const { size } = req.query;

    if (!size) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Params does not exists' });
    }

    let codes = [];

    for (var i = 0; i < size; i++) {
      const serialNumber = _v12.default.call(void 0, );
      await _Product2.default.create({ name, desc, lot, serialNumber });
      codes.push(_jsonwebtoken2.default.sign({ serialNumber }, process.env.CRYPTO_KEY));
    }
    return res.status(201).json({ success: true, errorMessage: '', codes });
  }

  async read(req, res) {
    const { token } = req.body;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, errorMessage: 'token does not found' });
    }

    let serialDecoded;

    try {
      const decoded = await _util.promisify.call(void 0, _jsonwebtoken2.default.verify)(
        token,
        process.env.CRYPTO_KEY
      );
      serialDecoded = decoded.serialNumber;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const product = await _Product2.default.findOne({ serialNumber: serialDecoded });

    if (product.flag) {
      const { name, desc, lot, serialNumber } = product;
      return res.status(201).json({
        success: true,
        errorMessage: '',
        product: { name, desc, lot, serialNumber },
        message: 'Produto já foi autenticado anteriormente!',
      });
    } else {
      const { name, desc, lot, serialNumber } = product;
      await _Product2.default.updateOne({ serialNumber }, { flag: true });
      return res.status(201).json({
        success: true,
        errorMessage: '',
        product: { name, desc, lot, serialNumber },
        message: 'Você autenticou este produto!',
      });
    }
  }
}

exports. default = new ProductController();
