import { Schema, model, Document, Types } from 'mongoose';
import { DOMAIN_EVENTS, domainEvents } from '../utils/domainEvents.js';

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
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const libraryPostFindOneAndUpdateHook = function(doc: ILibrary | null) {
    if (doc) {
        domainEvents.emit(DOMAIN_EVENTS.LIBRARY_UPDATED, doc._id);
    }
};

export const libraryPostFindOneAndDeleteHook = function(doc: ILibrary | null) {
    if (doc) {
        domainEvents.emit(DOMAIN_EVENTS.LIBRARY_DELETED, doc._id);
    }
};

librarySchema.post('findOneAndUpdate', function(doc) {
    libraryPostFindOneAndUpdateHook(doc as ILibrary | null);
});

librarySchema.post('findOneAndDelete', function(doc) {
    libraryPostFindOneAndDeleteHook(doc as ILibrary | null);
});

export const Library = model<ILibrary>('Library', librarySchema);
