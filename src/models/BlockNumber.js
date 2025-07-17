import mongoose from 'mongoose';

const blockNumberSchema = new mongoose.Schema({
  number: { type: String, required: true }
});

export default mongoose.model('BlockNumber', blockNumberSchema);