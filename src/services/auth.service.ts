import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import * as userRepo from '../repositories/user.repository';
import AppError from '../utils/AppError';
import type { AuthInput } from '../validators/schemas';

export const register = async ({ email, password }: AuthInput) => {
    if (await userRepo.findByEmail(email)) {
        throw new AppError(409, 'Email sudah terdaftar');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ email, password: hashed });
    return { id: user.id, email: user.email };
};

export const login = async ({ email, password }: AuthInput) => {
    const user = await userRepo.findByEmail(email);
    const valid = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !valid) {
        throw new AppError(401, 'Email atau password salah');
    }

    const token = jwt.sign({ sub: String(user.id) }, JWT_SECRET, { expiresIn: '1d' });
    return { token };
};