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

    const { size } = req.query;

    if (!size) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Params does not exists' });
    }

    const { name, desc, lot } = req.body;

    const lotExists = await Product.find({ lot: lot });

    if (lotExists.length !== 0) {
      return res
        .status(400)
        .json({ success: false, errorMessage: 'Lot already exists' });
    }

    let codes = [];

    for (var i = 0; i < size; i++) {
      const serialNumber = uuidv1();
      await Product.create({ name, desc, lot, serialNumber });
      codes.push(jwt.sign({ serialNumber }, process.env.CRYPTO_KEY));
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
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.CRYPTO_KEY
      );
      serialDecoded = decoded.serialNumber;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const product = await Product.findOne({ serialNumber: serialDecoded });

    if (!product.flag) {
      const { name, desc, lot, serialNumber } = product;
      return res.status(201).json({
        success: true,
        errorMessage: '',
        product: { name, desc, lot, serialNumber },
        message: 'Produto já foi autenticado anteriormente!',
        flag: false,
      });
    } else {
      const { name, desc, lot, serialNumber } = product;
      await Product.updateOne({ serialNumber }, { flag: false });
      return res.status(201).json({
        success: true,
        errorMessage: '',
        product: { name, desc, lot, serialNumber },
        message: 'Você autenticou este produto!',
        flag: true,
      });
    }
  }
}

export default new ProductController();
