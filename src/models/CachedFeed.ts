import { Schema, model, Document, Types } from 'mongoose';

export interface ICachedFeed extends Document {
    userId: Types.ObjectId;
    books: Types.ObjectId[];
    updatedAt: Date;
}

const cachedFeedSchema = new Schema<ICachedFeed>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    books: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
}, {
    timestamps: true
});

export const CachedFeed = model<ICachedFeed>('CachedFeed', cachedFeedSchema);
