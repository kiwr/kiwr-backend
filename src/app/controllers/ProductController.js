import * as Yup from 'yup';
import uuidv1 from 'uuid/v1';

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

    const lotExists = await Product.find({ lot: lot });

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

    for (var i = 0; i < size; i++) {
      await Product.create({ name, desc, lot, serialNumber: uuidv1() });
    }
    return res.status(201).json({ success: true, errorMessage: '' });
  }
}

export default new ProductController();
