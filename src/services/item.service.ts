import * as itemRepo from '../repositories/item.repository';
import AppError from '../utils/AppError';
import type { ItemInput, ListQuery } from '../validators/schemas';

const getOrFail = async (id: number) => {
  const item = await itemRepo.findById(id);
  if (!item) throw new AppError(404, 'Barang tidak ditemukan');
  return item;
};

export const create = (data: ItemInput) => itemRepo.create(data);

export const list = async ({ search, page, limit }: ListQuery) => {
  const { data, total } = await itemRepo.findAll({
    search,
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const update = async (id: number, data: ItemInput) => {
  await getOrFail(id);
  return itemRepo.update(id, data);
};

export const remove = async (id: number) => {
  await getOrFail(id);
  await itemRepo.remove(id);
};

export const decreaseStock = async (id: number, quantity: number) => {
  const affected = await itemRepo.decreaseStock(id, quantity);
  if (affected === 0) {
    await getOrFail(id);
    throw new AppError(409, 'Stok tidak mencukupi');
  }
  return itemRepo.findById(id);
};