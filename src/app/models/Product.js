import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
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

export default mongoose.model('Product', ProductSchema);
