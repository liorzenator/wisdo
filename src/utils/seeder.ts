import { User } from '../models/User.js';
import { Library } from '../models/Library.js';
import { Book } from '../models/Book.js';
import { getLogger } from '../../logger.js';

const logger = getLogger(import.meta.url);

export const seedDatabase = async () => {
    try {
        const userCount = await User.countDocuments();
        const libraryCount = await Library.countDocuments();

        if (userCount > 0 || libraryCount > 0) {
            logger.info('Database already seeded, skipping...');
            return;
        }

        logger.info('Seeding database with sample data...');

        // Create Libraries
        const library1 = await Library.create({
            name: 'Central Library',
            location: 'Downtown'
        });

        const library2 = await Library.create({
            name: 'Westside Library',
            location: 'West End'
        });

        // Create Users
        const user1 = await User.create({
            username: 'johndoe',
            password: 'password123',
            country: 'USA',
            libraries: [library1._id],
            role: 'user'
        });

        const user2 = await User.create({
            username: 'janedoe',
            password: 'password123',
            country: 'UK',
            libraries: [library2._id],
            role: 'user'
        });

        const admin = await User.create({
            username: 'admin',
            password: 'adminpassword',
            country: 'Global',
            libraries: [library1._id, library2._id],
            role: 'admin'
        });

        // Create some sample Books
        await Book.create({
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            publishedDate: new Date('1925-04-10'),
            pages: 180,
            library: library1._id
        });

        await Book.create({
            title: '1984',
            author: 'George Orwell',
            publishedDate: new Date('1949-06-08'),
            pages: 328,
            library: library2._id
        });

        logger.info('Database seeded successfully.');
    } catch (error) {
        logger.error('Error seeding database:', error);
    }
};
