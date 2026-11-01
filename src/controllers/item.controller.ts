import type { Request, Response } from 'express';
import * as itemService from '../services/item.service';
import { listQuerySchema } from '../validators/schemas';
import AppError from '../utils/AppError';

const parseId = (req: Request) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'ID tidak valid');
  }
  return id;
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await itemService.create(req.body));
};

export const list = async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  res.json(await itemService.list(query));
};

export const update = async (req: Request, res: Response) => {
  res.json(await itemService.update(parseId(req), req.body));
};

export const remove = async (req: Request, res: Response) => {
  await itemService.remove(parseId(req));
  res.status(204).send();
};

export const decreaseStock = async (req: Request, res: Response) => {
  res.json(await itemService.decreaseStock(parseId(req), req.body.quantity));
};