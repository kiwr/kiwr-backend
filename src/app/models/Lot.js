import mongoose from 'mongoose';

const LotSchema = new mongoose.Schema(
  {
    lot: {
      required: [true, 'Lot not informed'],
      type: String,
    },
  },
  {
    collection: 'lots',
  }
);

export default mongoose.model('Lots', LotSchema);
