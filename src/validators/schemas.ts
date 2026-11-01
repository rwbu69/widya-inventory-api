import { z } from "zod";

export const authSchema = z.object({
    email: z.email({ error: 'Format email tidak valid' }),
    password: z
        .string({ error: 'Password harus diisi' })
        .min(8, { error: 'Password minimal 8 karakter' }),
});

export const itemSchema = z.object({
    name: z
        .string({ error: 'Nama barang harus diisi' })
        .trim()
        .min(1, { error: 'Nama barang harus diisi' }),
    description: z.string().optional(),
    stock: z
        .number({ error: 'Stok harus berupa angka' })
        .int({ error: 'Stok harus berupa angka bulat' })
        .nonnegative({ error: 'Stok tidak boleh negatif' }),
    price: z
        .number({ error: 'Harga harus berupa angka' })
        .int({ error: 'Harga harus berupa angka bulat' })
        .nonnegative({ error: 'Harga tidak boleh negatif' }),
});

export const listQuerySchema = z.object({
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const decreaseSchema = z.object({
    quantity: z
        .number({ error: 'Kuantitas harus berupa angka' })
        .int({ error: 'Kuantitas harus berupa angka bulat' })
        .positive({ error: 'Kuantitas harus lebih besar dari 0' }),
});

export type AuthInput = z.infer<typeof authSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type DecreaseInput = z.infer<typeof decreaseSchema>;

