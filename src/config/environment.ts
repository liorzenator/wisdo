import Joi from 'joi';

interface EnvVars {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;
    REDIS_URL: string;
    FEED_CACHE_TTL: number;
    SEED_ON_STARTUP?: boolean;
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD?: string;
}

const envSchema = Joi.object<EnvVars>({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
    REDIS_URL: Joi.string().uri().required(),
    FEED_CACHE_TTL: Joi.number().default(3600),
    SEED_ON_STARTUP: Joi.boolean().default(false),
    ADMIN_USERNAME: Joi.string().default('admin'),
    ADMIN_PASSWORD: Joi.string().min(8).default('adminpassword123')
}).unknown(); // allows other env vars

const { error, value } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Environment validation error: ${errorMessages}`);
}

export default value as EnvVars;
