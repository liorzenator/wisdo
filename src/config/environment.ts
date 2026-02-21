import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),
    REDIS_URL: z.string().url(),
    FEED_CACHE_TTL: z.coerce.number().default(3600),
    SEED_ON_STARTUP: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
    ADMIN_USERNAME: z.string().default('admin'),
    ADMIN_PASSWORD: z.string().min(8).default('adminpassword123')
}).passthrough();

export type EnvVars = z.infer<typeof envSchema>;

export const validateEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const errorMessages = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Environment validation error: ${errorMessages}`);
    }
};

const result = envSchema.safeParse(process.env);
if (!result.success) {
    // In some environments, we might want to just log and exit or use defaults
    // For now, let's just parse what we can or throw
    console.warn('Environment validation warning:', result.error.format());
}

export default (result.success ? result.data : process.env) as EnvVars;
