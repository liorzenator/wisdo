import { User } from '../models/User.js';
import { Library } from '../models/Library.js';
import { Book } from '../models/Book.js';
import { getLogger } from '../config/logger.js';
import { faker } from '@faker-js/faker';

const logger = getLogger(import.meta.url);

export const seedDatabase = async () => {
    try {
        logger.info('Resetting and seeding database with faker data...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Library.deleteMany({}),
            Book.deleteMany({})
        ]);

        logger.info('Database cleared.');

        // Create 10 Libraries
        const libraries = [];
        for (let i = 0; i < 10; i++) {
            const library = await Library.create({
                name: faker.company.name() + ' Library',
                location: faker.location.city()
            });
            libraries.push(library);
        }

        logger.info('Libraries created.');

        // Create a hardcoded admin user
        const allLibraryIds = libraries.map(lib => lib._id);
        const hardcodedAdmin = await User.create({
            username: 'admin',
            password: 'adminpassword123',
            country: 'USA',
            libraries: allLibraryIds,
            role: 'admin'
        });
        
        logger.info(`Hardcoded admin user created: ${hardcodedAdmin.username}`);

        // Create 4 additional Users with different roles and link them to random libraries
        const roles: ('admin' | 'user')[] = ['user', 'user', 'user', 'user'];
        const users = [hardcodedAdmin];
        for (let i = 0; i < 4; i++) {
            const role = roles[i];
            const numLibraries = faker.number.int({ min: 1, max: 3 });
            const selectedLibraries = role === 'admin' 
                ? allLibraryIds 
                : faker.helpers.arrayElements(libraries, numLibraries).map(lib => lib._id);
            
            const user = await User.create({
                username: faker.internet.username(),
                password: 'password123',
                country: faker.location.country(),
                libraries: selectedLibraries,
                role: role
            });
            users.push(user);
        }

        // Create 1000 Books distributed among the 10 libraries
        const booksData = [];
        for (let i = 0; i < 1000; i++) {
            const library = faker.helpers.arrayElement(libraries);
            booksData.push({
                title: faker.book.title(),
                author: faker.book.author(),
                publishedDate: faker.date.past({ years: 50 }),
                pages: faker.number.int({ min: 50, max: 1000 }),
                authorCountry: faker.location.country(),
                library: library._id
            });
        }

        // Use insertMany for efficiency
        await Book.insertMany(booksData);

        logger.info('Database seeded successfully with 10 libraries, 5 users, and 1000 books.');
    } catch (error) {
        logger.error('Error seeding database:', error);
    }
};
