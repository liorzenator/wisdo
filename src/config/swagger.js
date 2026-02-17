import swaggerJsdoc from 'swagger-jsdoc';

// Use relative server URL to always point to the same origin where the app is served.
// This avoids CORS and port mismatches between Swagger UI and the API server.
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wisdo API',
      version: '1.0.0',
      description: 'API documentation for Wisdo project',
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
  },
  // Centralize OpenAPI docs under /docs to avoid cluttering route files
  apis: ['./docs/**/*.yaml', './docs/**/*.yml', './docs/**/*.json', './docs/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
