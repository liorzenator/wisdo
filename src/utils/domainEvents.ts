import EventEmitter from 'events';

export const domainEvents = new EventEmitter();

export const DOMAIN_EVENTS = {
    BOOK_CREATED: 'book:created',
    BOOK_DELETED: 'book:deleted',
    USER_LIBRARIES_UPDATED: 'user:libraries_updated',
    LIBRARY_UPDATED: 'library:updated',
    LIBRARY_DELETED: 'library:deleted',
};
