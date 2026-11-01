import prisma from '../config/prisma';
import type { ItemInput } from '../validators/schemas';

export const create = (data: ItemInput) => prisma.item.create({ data });

export const findAll = async (opts: { search?: string; skip: number; take: number }) => {
    const where = opts.search
        ? { name: { contains: opts.search, mode: 'insensitive' as const } }
        : {};

    const [data, total] = await prisma.$transaction([
        prisma.item.findMany({
            where,
            skip: opts.skip,
            take: opts.take,
            orderBy: { id: 'desc' }
        }),
        prisma.item.count({ where })
    ]);

    return { data, total };
};

export const findById = (id: number) => prisma.item.findUnique({ where: { id } });

export const update = (id: number, data: Partial<ItemInput>) =>
    prisma.item.update({ where: { id }, data });

export const remove = (id: number) => prisma.item.delete({ where: { id } });

export const decreaseStock = async (id: number, quantity: number) => {
    const result = await prisma.item.updateMany({
        where: { id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } }
    });

    return result.count;
};