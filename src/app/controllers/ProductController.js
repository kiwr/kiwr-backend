import * as Yup from 'yup';
import uuidv1 from 'uuid/v1';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import mongoose from 'mongoose';

import Product from '../models/Product';
import Lot from '../models/Lot';

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
      existsLot = await Lot.find({ lot: lot });
    } catch (err) {
      console.log(err);
    }

    let newLot;
    if (existsLot.length === 0) {
      try {
        newLot = await Lot.create({ lot: lot });
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        newLot = await Lot.findOne({ lot: lot });
      } catch (err) {
        console.log(err);
      }
    }

    let oldLotLength = newLot.products.length;
    //used to store new jwt tokens
    let codes = [];
    //create new products, add they on lot and create jwt tokens
    for (let i = 0; i < size; i++) {
      let serialNumber = uuidv1();
      const newProduct = new Product({
        _id: mongoose.Types.ObjectId(),
        name,
        desc,
        lot,
        serialNumber,
      });
      newLot.products.push(newProduct);
      codes.push(jwt.sign({ serialNumber }, process.env.CRYPTO_KEY));
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
      const decoded = await promisify(jwt.verify)(
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
      productObj = await Lot.findOne({
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
      allLot = await Lot.find();
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
        let jwtCode = jwt.sign(
          { serialNumber: product.serialNumber },
          process.env.CRYPTO_KEY
        );
        productInLots[property] = [...productInLots[property], jwtCode];
      });
    });

    if (
      Object.entries(productInLots).length === 0 &&
      productInLots.constructor === Object
    ) {
      return res.status(200).json({ success: false, errorMessage: '' });
    } else {
      return res
        .status(200)
        .json({ success: true, errorMessage: '', produtos: productInLots });
    }
  }
}

export default new ProductController();
