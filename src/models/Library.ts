import { Schema, model, Document, Types } from 'mongoose';

export interface ILibrary extends Document {
    _id: Types.ObjectId;
    id: string;
    name: string;
    location: string;
}

const librarySchema = new Schema<ILibrary>({
    name: { type: String, required: true },
    location: { type: String, required: true }
}, {
    timestamps: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const Library = model<ILibrary>('Library', librarySchema);
