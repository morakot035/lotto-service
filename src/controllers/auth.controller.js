import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (uid) =>
  jwt.sign({ id: uid }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email ซ้ำ' });

    const user = await User.create({ email, password });
    const token = signToken(user._id);
    res.status(201).json({ token });
  } catch (e) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ msg: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const token = signToken(user._id);
    res.json({ token });
  } catch (e) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const me = (req, res) => {
  res.json(req.user);
};