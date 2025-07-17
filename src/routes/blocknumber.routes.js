import express from 'express';
import {
  getBuyers,
  createBuyer,
  updateBuyer,
  deleteBuyer,
} from '../controllers/buyer.controller.js';

const router = express.Router();

router.get('/', getBuyers);
router.post('/', createBuyer);
router.put('/:id', updateBuyer);
router.delete('/:id', deleteBuyer);

export default router;
