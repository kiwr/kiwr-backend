"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _yup = require('yup'); var Yup = _interopRequireWildcard(_yup);
var _v1 = require('uuid/v1'); var _v12 = _interopRequireDefault(_v1);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _util = require('util');
var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);

var _Product = require('../models/Product'); var _Product2 = _interopRequireDefault(_Product);
var _Lot = require('../models/Lot'); var _Lot2 = _interopRequireDefault(_Lot);
var _rxjs = require('rxjs');

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
    const { size } = req.query;

    if (!size) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Params does not exists' });
    }
    //verify lot does exists, if does not, create a new lot without products
    let existsLot = [];
    try {
      existsLot = await _Lot2.default.find({ lot: lot });
    } catch (err) {
      console.log(err);
    }

    let newLot;
    if (existsLot.length === 0) {
      try {
        newLot = await _Lot2.default.create({ lot: lot });
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        newLot = await _Lot2.default.findOne({ lot: lot });
      } catch (err) {
        console.log(err);
      }
    }

    let oldLotLength = newLot.products.length;
    //used to store new jwt tokens
    let codes = [];
    //create new products, add they on lot and create jwt tokens
    for (let i = 0; i < size; i++) {
      let serialNumber = _v12.default.call(void 0, );
      const newProduct = new (0, _Product2.default)({
        _id: _mongoose2.default.Types.ObjectId(),
        name,
        desc,
        lot,
        serialNumber,
      });
      newLot.products.push(newProduct);
      codes.push(_jsonwebtoken2.default.sign({ serialNumber }, process.env.CRYPTO_KEY));
    }

    //update the lot on b
    try {
      newLot.markModified('products');
      await newLot.save();
    } catch (err) {
      return res.status(400).json({
        success: false,
        errorMessage: err,
        message: 'Não foi possível cadastrar os produtos',
      });
    }

    return res.status(200).json({
      success: true,
      errorMessage: '',
      initialIndex: oldLotLength,
      products: codes,
    });
  }

  async read(req, res) {
    const { token } = req.params;

    if (!token) {
      return res.status(401).json({
        success: false,
        errorMessage: 'Código de produto não encontrado!',
      });
    }

    let serialDecoded;

    try {
      const decoded = await _util.promisify.call(void 0, _jsonwebtoken2.default.verify)(
        token,
        process.env.CRYPTO_KEY
      );
      serialDecoded = decoded.serialNumber;
    } catch (err) {
      return res.status(401).json({ error: 'Código inválido!' });
    }

    let product;
    let productObj;
    try {
      productObj = await _Lot2.default.findOne({
        'products.serialNumber': serialDecoded,
      });
      let productList = productObj.products;
      productList.map(productItem => {
        if (productItem.serialNumber == serialDecoded) {
          product = productItem;
        }
      });
      if (product == null) {
        throw 'Product not found!';
      }
    } catch (err) {
      return res.status(401).json({ success: false, errorMessage: err });
    }

    if (product.flag) {
      const { name, desc, lot, serialNumber } = product;
      productObj.products.forEach(productItem => {
        if (productItem.serialNumber == serialDecoded) {
          productItem.flag = false;
        }
      });
      productObj.markModified('products');
      await productObj.save();
      return res.status(201).json({
        success: true,
        errorMessage: '',
        product: {
          name,
          desc,
          lot,
          serialNumber,
          flag: true,
          message: 'Você autenticou este produto agora!',
        },
      });
    } else {
      const { name, desc, lot, serialNumber } = product;

      return res.status(201).json({
        success: true,
        errorMessage: '',
        product: {
          name,
          desc,
          lot,
          serialNumber,
          flag: false,
          message: 'Produto já foi autenticado anteriormente!',
        },
      });
    }
  }

  async readAll(req, res) {
    let allLot;
    try {
      allLot = await _Lot2.default.find();
    } catch (err) {
      return res.status(401).json({
        success: false,
        errorMessage: err,
        message: 'Não foi possível encontrar os produtos',
      });
    }

    let arrayLots = [];
    allLot.map(lotItem => {
      arrayLots.push(lotItem);
    });

    let productInLots = {};
    arrayLots.map(lotItem => {
      let property = String(lotItem.lot);
      Object.defineProperty(productInLots, property, {
        value: [],
        writable: true,
        enumerable: true,
      });
      lotItem.products.map(product => {
        let jwtCode = _jsonwebtoken2.default.sign(
          { serialNumber: product.serialNumber },
          process.env.CRYPTO_KEY
        );
        productInLots[property] = [...productInLots[property], jwtCode];
      });
    });
    return res
      .status(200)
      .json({ success: true, errorMessage: '', produtos: productInLots });
  }
}

exports. default = new ProductController();
