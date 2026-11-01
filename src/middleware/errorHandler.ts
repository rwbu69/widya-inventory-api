import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import AppError from '../utils/AppError';

export default function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (err instanceof AppError) {
        res.status(err.status).json({
            message: err.message
        });
        return;
    }

    if (err instanceof ZodError) {
        res.status(400).json({
            message: 'Query tidak valid',
            errors: err.issues
        });
        return;
    }

    if ((err as { type?: string }).type === 'entity.parse.failed') {
        res.status(400).json({
            message: 'JSON tidak valid',
        });
        return;
    }

    console.error(err);

    res.status(500).json({
        message: 'Terjadi kesalahan pada server',
    });
}