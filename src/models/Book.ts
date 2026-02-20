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

// Most critical — used in EVERY feed aggregate and getBooksByLibraryIds
bookSchema.index({ library: 1 });

// Feed aggregate sorts by sameCountry then weightedScore.
// This helps MongoDB filter books by library AND country together
// before it computes the expensive $addFields scoring stage
bookSchema.index({ library: 1, authorCountry: 1 });

// Feed aggregate uses publishedDate to compute ageInYears —
// having it indexed helps when the dataset is large
bookSchema.index({ publishedDate: -1 });

// Optional: if you add search by title/author later
bookSchema.index({ title: 'text', author: 'text' });

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
