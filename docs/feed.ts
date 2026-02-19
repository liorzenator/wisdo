/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Personal book recommendations
 *
 * /feed:
 *   get:
 *     summary: Returns a ranked list of recommended books for the authenticated user
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The maximum number of books to return
 *     responses:
 *       200:
 *         description: A list of recommended books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       401:
 *         description: Unauthorized
 */
export {};
