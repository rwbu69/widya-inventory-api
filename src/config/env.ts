import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET belom berisi, jalankan npm run setup');
}

export const JWT_SECRET: string = jwtSecret;
export const PORT = Number(process.env.PORT) || 3000;

