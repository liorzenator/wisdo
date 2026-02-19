import { Schema, model, Document, Types } from 'mongoose';
import { DOMAIN_EVENTS, domainEvents } from '../utils/domainEvents.js';

export interface IBook extends Document {
    _id: Types.ObjectId;
    id: string;
    title: string;
    author: string;
    publishedDate: Date;
    pages: number;
    authorCountry: string;
    library: Types.ObjectId;
}

const bookSchema = new Schema<IBook>({
    title: { type: String, required: true },
    author: { type: String, required: true },
    publishedDate: { type: Date, required: true },
    pages: { type: Number, required: true },
    authorCountry: { type: String, required: true },
    library: { type: Schema.Types.ObjectId, ref: 'Library', required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const bookPostSaveHook = function(doc: IBook) {
    domainEvents.emit(DOMAIN_EVENTS.BOOK_CREATED, doc.library);
};

export const bookPostFindOneAndDeleteHook = function(doc: IBook | null) {
    if (doc) {
        domainEvents.emit(DOMAIN_EVENTS.BOOK_DELETED, doc.library);
    }
};

bookSchema.post('save', function(doc) {
    bookPostSaveHook(doc as IBook);
});

bookSchema.post('findOneAndDelete', function(doc) {
    bookPostFindOneAndDeleteHook(doc as IBook | null);
});

// For update operations, we might need to refresh both old and new library feeds
// However, findByIdAndUpdate doesn't easily provide the old library ID in a post hook without more complex logic.
// For now, let's focus on the most common cases.

export const Book = model<IBook>('Book', bookSchema);
