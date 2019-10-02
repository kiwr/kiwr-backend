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
    let existsLot;
    try {
      existsLot = await Lot.find({ lot: lot });
    } catch (err) {
      console.log(err);
    }

    if (existsLot.length === 0) {
      await Lot.create({ lot: lot });
    }
    //get the lot and get the product's array length
    let newLot;
    try {
      newLot = await Lot.findOne({ lot: lot });
    } catch (err) {
      console.log(err);
    }
    let oldLotLength = newLot.products.length + 1;
    //used to store new jwt tokens
    let codes = [];
    //create new products, add they on lot and create jwt tokens
    for (var i = 0; i < size; i++) {
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
    //update the lot on bd
    let updateLot;
    try {
      updateLot = await Lot.findOneAndUpdate(
        { lot: lot },
        { products: newLot.products },
        { useFindAndModify: false }
      );
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
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        errorMessage: 'Token não foi encontrado na requisição!',
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
      return res.status(401).json({ error: 'Toke inválido!' });
    }

    const product = await Product.findOne({ serialNumber: serialDecoded });

    if (!product.flag) {
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
          message: "'Produto já foi autenticado anteriormente!'",
        },
      });
    } else {
      const { name, desc, lot, serialNumber } = product;
      await Product.updateOne({ serialNumber }, { flag: false });
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
    }
  }

  async readAll(req, res) {
    let productList;
    let lotList;
    let productsInLots = {};

    try {
      lotList = await Lot.find({});
    } catch (err) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Falha ao recuperar dados de lote',
      });
    }

    try {
      productList = await Product.find({});
    } catch (err) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Falha ao recuperar dados de produto',
      });
    }

    lotList.map(lotItem => {
      console.log(lotItem.lot, productsInLots);
      Object.defineProperty(productsInLots, String(lotItem.lot), {
        value: [],
        writable: true,
        enumerable: true,
      });
    });

    productList.map(product => {
      var lotExists = productsInLots.hasOwnProperty(product.lot);

      if (lotExists) {
        console.log('entrei');
        var serialNumber = product.serialNumber;
        productsInLots[product.lot].push(
          jwt.sign({ serialNumber }, process.env.CRYPTO_KEY)
        );
        console.log(productsInLots);
      }
    });

    return res
      .status(200)
      .json({ success: true, errorMessage: '', products: productsInLots });
  }
}

export default new ProductController();
