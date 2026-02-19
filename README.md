# Wisdo API

Wisdo is a robust Node.js and TypeScript-based REST API designed for managing a library of books and providing personalized feeds for users. It features secure authentication, efficient data caching, and comprehensive API documentation.

## Features

- **Authentication & Authorization**: Secure JWT-based authentication with access and refresh tokens.
- **Library Management**: Manage libraries and books with detailed information.
- **Personalized Feed**: A curated feed of books for users, with server-side caching for improved performance.
- **Database Seeding**: Automatic database population with realistic data using Faker for development and testing.
- **API Documentation**: Interactive Swagger UI for easy API exploration and testing.
- **Containerization**: Full Docker and Docker Compose support for consistent development and deployment environments.
- **Logging**: Integrated logging system using Winston for better traceability.

## Technologies Used

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Security**: Passport.js, JWT, Bcrypt
- **Documentation**: Swagger UI, OpenAPI 3.0
- **Testing**: Mocha, Chai, Sinon, Supertest
- **Containerization**: Docker, Docker Compose

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [MongoDB](https://www.mongodb.com/) (if running locally)
- [Docker](https://www.docker.com/) (optional, for containerized execution)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd wisdo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on the following template:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=mongodb://root:password@localhost:27017/wisdo?authSource=admin
   JWT_SECRET=your_32_character_secret_key_here
   JWT_REFRESH_SECRET=your_32_character_refresh_secret_key_here
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   
   # For Docker Compose
   DB_USERNAME=root
   DB_PASSWORD=password
   DB_NAME=wisdo
   ```

## Running the Application

### Locally

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

### Using Docker

**Start the entire stack (API + MongoDB):**
```bash
docker-compose up --build
```

The API will be available at `http://localhost:3000`.

## API Documentation

When the application is running in development mode, you can access the interactive Swagger documentation at:
`http://localhost:3000/api-docs`

## Database Seeding

In development mode (`NODE_ENV=development`), the application automatically seeds the database with 10 libraries, 1000 books, and several test users (including a hardcoded admin) upon startup.

- **Admin Username**: `admin`
- **Admin Password**: `adminpassword123`

## Testing

Run the automated test suite using:
```bash
npm test
```

## Linting

Run the linter to check for code style issues:
```bash
npm run lint
```
