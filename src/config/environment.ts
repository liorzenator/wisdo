import Joi from 'joi';

interface EnvVars {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
}

const envSchema = Joi.object<EnvVars>({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(32).required(),
}).unknown(); // allows other env vars

const { error, value } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Environment validation error: ${errorMessages}`);
}

export default value as EnvVars;
