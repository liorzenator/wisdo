import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../config/logger.js';
import { ServiceError } from '../errors/ServiceError.js';
import mongoose from 'mongoose';

const logger = getLogger(import.meta.url);

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // If headers already sent, delegate to the default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    // Handle ServiceError
    if (err instanceof ServiceError) {
        return res.status(err.status).json({ error: err.message });
    }

    // Handle Mongoose Validation Errors
    if (err instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Handle Mongoose Cast Errors (e.g. invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
    }

    // Generic Internal Server Error
    logger.error('Unhandled error:', err);
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
};
