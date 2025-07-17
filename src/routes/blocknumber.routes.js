import express from 'express';
import {
  getBlockNumber,
  createBlockNumber,
  updateBlockNumber,
  deleteBlockNumber,
} from '../controllers/blocknumber.conntroller.js';

const router = express.Router();

router.get('/', getBlockNumber);
router.post('/', createBlockNumber);
router.put('/:id', updateBlockNumber);
router.delete('/:id', deleteBlockNumber);

export default router;
