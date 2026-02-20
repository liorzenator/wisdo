/**
 * @openapi
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Returns a welcome message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 status:
 *                   type: string
 *                 database:
 *                   type: string
 *                 redis:
 *                   type: string
 */
export {};
