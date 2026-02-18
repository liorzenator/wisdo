import mongoose from 'mongoose';
import env from './environment.js';
import { getLogger } from '../../logger.js';

const logger = getLogger(import.meta.url);

const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(env.DATABASE_URL);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
};

export default connectDatabase;
