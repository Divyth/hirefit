import { ObjectId } from 'mongodb';
import { getDb } from '../database/client.js';
import { COLLECTIONS } from '../database/collections.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

class AuthController {
  collection() {
    return getDb().collection(COLLECTIONS.users);
  }

  async register(req, res) {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.collection().findOne({ email: normalizedEmail });
    if (existing) {
      throw new HttpError(409, 'Email is already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await this.collection().insertOne(user);
    const token = signToken({ sub: result.insertedId.toString(), email: normalizedEmail, name: user.name });
    return res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        name: user.name,
        email: user.email
      }
    });
  }

  async login(req, res) {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.collection().findOne({ email: normalizedEmail });
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = signToken({ sub: user._id.toString(), email: user.email, name: user.name });
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  }

  async profile(req, res) {
    const user = await this.collection().findOne({ _id: new ObjectId(req.user.sub) }, { projection: { passwordHash: 0 } });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  }
}

export const authController = new AuthController();
