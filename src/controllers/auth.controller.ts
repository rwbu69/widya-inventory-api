import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: 'Registrasi berhasil', data: user });
};

export const login = async (req: Request, res: Response) => {
  res.json(await authService.login(req.body));
};