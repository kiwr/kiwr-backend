import * as Yup from 'yup';
import uuidv1 from 'uuid/v1';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import Product from '../models/Product';

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

    let existsLot;
    try {
      existsLot = await Lot.find({ lot: lot });
    } catch (err) {
      console.log(err);
    }
    if (existsLot.length === 0) {
      try {
        let newLot = await Lot.create({ lot });
      } catch (err) {
        console.log(err);
      }
    }

    const { size } = req.query;

    if (!size) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Params does not exists' });
    }

    let codes = [];

    for (var i = 0; i < size; i++) {
      const serialNumber = uuidv1();

      try {
        let newProduct = await Product.create({
          name,
          desc,
          lot,
          serialNumber,
        });
        codes.push(jwt.sign({ serialNumber }, process.env.CRYPTO_KEY));
      } catch (err) {
        return res.status(400).json({ success: false, errorMessage: err });
      }
    }
    return res.status(201).json({ success: true, errorMessage: '', codes });
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
    let productMap = [];
    let productList;

    try {
      productList = await Product.find({});
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Falha ao recuperar dados' });
    }

    productList.map(product => {
      let serialNumber = product.serialNumber;
      productMap.push(jwt.sign({ serialNumber }, process.env.CRYPTO_KEY));
    });
    return res
      .status(200)
      .json({ success: true, errorMessage: '', products: productMap });
  }
}

export default new ProductController();
