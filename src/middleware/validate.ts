import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

export default function validate(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                message: 'Validation error',
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message
                })),
            });

            return;
        }

        req.body = result.data;
        next();
    }
}