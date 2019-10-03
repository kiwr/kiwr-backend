import mongoose from 'mongoose';
import Product from './Product';

let ProductSchema = mongoose.model('Product').schema;

const LotSchema = new mongoose.Schema(
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

export default mongoose.model('Lots', LotSchema);
