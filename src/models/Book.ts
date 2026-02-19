import { Schema, model, Document, Types } from 'mongoose';

export interface IBook extends Document {
    _id: Types.ObjectId;
    id: string;
    title: string;
    author: string;
    publishedDate: Date;
    pages: number;
    library: Types.ObjectId;
}

const bookSchema = new Schema<IBook>({
    title: { type: String, required: true },
    author: { type: String, required: true },
    publishedDate: { type: Date, required: true },
    pages: { type: Number, required: true },
    library: { type: Schema.Types.ObjectId, ref: 'Library', required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const Book = model<IBook>('Book', bookSchema);
