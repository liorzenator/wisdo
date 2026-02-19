import {Types} from 'mongoose';
import {Book, IBook} from '../models/Book.js';
import {CachedFeed} from '../models/CachedFeed.js';
import {IUser, User} from "../models/User.js";

interface IIBook extends IBook {
    _id: Types.ObjectId;
}

export class FeedService {
    async getFeedForUser(limit: number = 10, user: IUser): Promise<IBook[]> {
        // Try to get from cache first if userId is provided
        if (user._id) {
            const cached = await CachedFeed.findOne({userId: user._id}).populate('books');
            if (cached && cached.books.length > 0) {
                // If we have cached feed, return it (respecting the limit)
                return (cached.books as unknown as IIBook[]).slice(0, limit);
            }
        }

        const ids = (user.libraries || []).map(id => new Types.ObjectId(id as any));
        const books = await Book.find({library: {$in: ids}});

        if (books.length === 0) {
            return [];
        }

        const scoredBooks = this.getScoredBooks(books);

        scoredBooks.sort((a, b) => {
            if (a.sameCountry !== b.sameCountry) {
                return b.sameCountry - a.sameCountry;
            }
            return b.weightedScore - a.weightedScore;
        });

        const result = scoredBooks.slice(0, 100).map(sb => sb.book); // Cache more than requested limit

        // Update cache asynchronously if userId is provided
        if (user._id) {
            CachedFeed.findOneAndUpdate(
                {userId: user._id},
                {books: result.map(b => b._id)},
                {upsert: true}
            ).catch(err => console.error('Error updating cache:', err));
        }

        return result.slice(0, limit);
    }

    private getScoredBooks(books: IBook[], userCountry?: string) {
        const now = new Date();

        return books.map(book => {
            const sameCountry = userCountry && book.authorCountry === userCountry ? 1 : 0;
            const pagesScore = book.pages;
            const ageInYears = (now.getTime() - book.publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const ageScore = ageInYears;
            const weightedScore = (pagesScore * 0.8) + (ageScore * 0.2);

            return {
                book,
                sameCountry,
                weightedScore
            };
        });
    }

    async preCalculateFeed(user: IUser) {
        const books = await Book.find({library: {$in: user.libraries}});
        if (books.length === 0) {
            await CachedFeed.findOneAndDelete({userId: user._id});
            return;
        }

        const scoredBooks = this.getScoredBooks(books, user.country)

        scoredBooks.sort((a, b) => {
            if (a.sameCountry !== b.sameCountry) return b.sameCountry - a.sameCountry;
            return b.weightedScore - a.weightedScore;
        });

        const result = scoredBooks.slice(0, 100).map(sb => sb.book._id);
        await CachedFeed.findOneAndUpdate({userId: user._id}, {books: result}, {upsert: true});
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
