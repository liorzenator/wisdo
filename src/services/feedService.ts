import {Types} from 'mongoose';
import {Book, IBook} from '../models/Book.js';
import {Library} from '../models/Library.js';
import {CachedFeed} from '../models/CachedFeed.js';
import {IUser, User} from "../models/User.js";
import { DOMAIN_EVENTS, domainEvents } from '../utils/domainEvents.js';

interface IIBook extends IBook {
    _id: Types.ObjectId;
}

import { getLogger } from '../../logger.js';
const logger = getLogger(import.meta.url);

export class FeedService {
    async getFeedForUser(limit: number = 10, user: IUser): Promise<IBook[]> {
        // Try to get from cache first if userId is provided
        if (user._id) {
            const cached = await CachedFeed.findOne({ userId: user._id }).populate('books');
            if (cached && cached.books.length > 0) {
                // If we have cached feed, return it (respecting the limit)
                return (cached.books as unknown as IIBook[]).slice(0, limit);
            }
        }

        let libraryIds: Types.ObjectId[] = [];
        if (user.role === 'admin') {
            const allLibraries = await Library.find({}, '_id');
            libraryIds = allLibraries.map(lib => lib._id);
        } else {
            libraryIds = (user.libraries || []).map(id => new Types.ObjectId(id as any));
        }

        if (libraryIds.length === 0) {
            return [];
        }

        const scoredBooks = await Book.aggregate([
            {
                $match: {
                    library: { $in: libraryIds }
                }
            },
            {
                $addFields: {
                    sameCountry: {
                        $cond: {
                            if: { $eq: ['$authorCountry', user.country || ''] },
                            then: 1,
                            else: 0
                        }
                    },
                    pagesScore: '$pages',
                    // Calculate age in years: (now - publishedDate) / (1000 * 60 * 60 * 24 * 365.25)
                    // MongoDB $subtract on dates returns milliseconds
                    ageInYears: {
                        $divide: [
                            { $subtract: [new Date(), '$publishedDate'] },
                            1000 * 60 * 60 * 24 * 365.25
                        ]
                    }
                }
            },
            {
                $addFields: {
                    weightedScore: {
                        $add: [
                            { $multiply: ['$pagesScore', 0.8] },
                            { $multiply: ['$ageInYears', 0.2] }
                        ]
                    }
                }
            },
            {
                $sort: {
                    sameCountry: -1,
                    weightedScore: -1
                }
            },
            {
                $limit: 100 // Fetch up to 100 to cache
            }
        ]);

        if (scoredBooks.length === 0) {
            return [];
        }

        // Update cache asynchronously if userId is provided
        if (user._id) {
            CachedFeed.findOneAndUpdate(
                { userId: user._id },
                { books: scoredBooks.map(b => b._id) },
                { upsert: true }
            ).catch(err => logger.error('Error updating cache:', err));
        }

        return scoredBooks.slice(0, limit);
    }

    async preCalculateFeed(user: IUser) {
        const libraryIds = (user.libraries || []).map(id => new Types.ObjectId(id as any));
        if (libraryIds.length === 0) {
            await CachedFeed.findOneAndDelete({ userId: user._id });
            return;
        }

        const scoredBooks = await Book.aggregate([
            {
                $match: {
                    library: { $in: libraryIds }
                }
            },
            {
                $addFields: {
                    sameCountry: {
                        $cond: {
                            if: { $eq: ['$authorCountry', user.country || ''] },
                            then: 1,
                            else: 0
                        }
                    },
                    pagesScore: '$pages',
                    ageInYears: {
                        $divide: [
                            { $subtract: [new Date(), '$publishedDate'] },
                            1000 * 60 * 60 * 24 * 365.25
                        ]
                    }
                }
            },
            {
                $addFields: {
                    weightedScore: {
                        $add: [
                            { $multiply: ['$pagesScore', 0.8] },
                            { $multiply: ['$ageInYears', 0.2] }
                        ]
                    }
                }
            },
            {
                $sort: {
                    sameCountry: -1,
                    weightedScore: -1
                }
            },
            {
                $limit: 100
            },
            {
                $project: { _id: 1 }
            }
        ]);

        if (scoredBooks.length === 0) {
            await CachedFeed.findOneAndDelete({ userId: user._id });
            return;
        }

        const result = scoredBooks.map(sb => sb._id);
        await CachedFeed.findOneAndUpdate({ userId: user._id }, { books: result }, { upsert: true });
    }

    async preCalculateAllFeeds() {
        const users = await User.find({});
        const promises = users.map(user => this.preCalculateFeed(user));
        await Promise.all(promises);
    }

    async refreshFeedForUsersInLibrary(libraryId: string | Types.ObjectId) {
        const users = await User.find({libraries: libraryId});
        const promises = users.map(user => this.preCalculateFeed(user));
        await Promise.all(promises);
    }

    async refreshFeedForUser(userId: string | Types.ObjectId) {
        const user = await User.findById(userId);
        if (user) {
            await this.preCalculateFeed(user);
        }
    }
}

export const feedService = new FeedService();

domainEvents.on(DOMAIN_EVENTS.BOOK_CREATED, (libraryId) => {
    feedService.refreshFeedForUsersInLibrary(libraryId).catch(err => logger.error('Error refreshing feed on BOOK_CREATED:', err));
});

domainEvents.on(DOMAIN_EVENTS.BOOK_DELETED, (libraryId) => {
    feedService.refreshFeedForUsersInLibrary(libraryId).catch(err => logger.error('Error refreshing feed on BOOK_DELETED:', err));
});

domainEvents.on(DOMAIN_EVENTS.USER_LIBRARIES_UPDATED, (userId) => {
    feedService.refreshFeedForUser(userId).catch(err => logger.error('Error refreshing feed on USER_LIBRARIES_UPDATED:', err));
});

domainEvents.on(DOMAIN_EVENTS.LIBRARY_UPDATED, (libraryId) => {
    feedService.refreshFeedForUsersInLibrary(libraryId).catch(err => logger.error('Error refreshing feed on LIBRARY_UPDATED:', err));
});

domainEvents.on(DOMAIN_EVENTS.LIBRARY_DELETED, (libraryId) => {
    feedService.refreshFeedForUsersInLibrary(libraryId).catch(err => logger.error('Error refreshing feed on LIBRARY_DELETED:', err));
});
