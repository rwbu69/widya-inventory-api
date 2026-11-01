import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import AppError from '../utils/AppError';

export default function auth(req: Request, res: Response, next: NextFunction): void {
    const [type, token] = (req.headers.authorization || '').split(' ');

    if (type !== 'Bearer' || !token) {
        throw new AppError(401, 'Token tidak ditemukan (unauthorized)');
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        res.locals.userId = Number(payload.userId);
        next();
    } catch {
        throw new AppError(401, 'Token tidak valid (unauthorized)');
    }

}