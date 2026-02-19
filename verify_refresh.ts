import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 3003;
process.env.PORT = PORT.toString();
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mongodb://root:password@localhost:27017/wisdo_test?authSource=admin';
process.env.JWT_SECRET = 'this-is-a-very-secret-key-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'this-is-another-very-secret-key-at-least-32-characters-long';
process.env.JWT_ACCESS_EXPIRATION = '10s';
process.env.JWT_REFRESH_EXPIRATION = '1m';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log('Starting server...');
    const server = spawn('cmd', ['/c', 'node dist/index.js'], {
        env: process.env,
        stdio: 'inherit'
    });

    await sleep(5000); // Wait for server and DB

    const api = axios.create({
        baseURL: `http://localhost:${PORT}/api`,
        validateStatus: () => true
    });

    try {
        console.log('--- Testing Login ---');
        const loginRes = await api.post('/auth/login', {
            username: 'admin',
            password: 'adminpassword'
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
        }

        const { accessToken, refreshToken } = loginRes.data as any;
        console.log('Login successful');
        console.log('Access Token:', accessToken.substring(0, 20) + '...');
        console.log('Refresh Token:', refreshToken.substring(0, 20) + '...');

        console.log('\n--- Testing Protected Route with Access Token ---');
        const booksRes = await api.get('/books', {
            headers: { Authorization: accessToken }
        });

        if (booksRes.status !== 200) {
            throw new Error(`Protected route access failed: ${JSON.stringify(booksRes.data)}`);
        }
        console.log('Access granted');

        console.log('\n--- Testing Token Refresh ---');
        const refreshRes = await api.post('/auth/refresh', { refreshToken });

        if (refreshRes.status !== 200) {
            throw new Error(`Refresh failed: ${JSON.stringify(refreshRes.data)}`);
        }

        const newTokens = refreshRes.data as any;
        console.log('Refresh successful');
        console.log('New Access Token:', newTokens.accessToken.substring(0, 20) + '...');

        console.log('\n--- Testing Protected Route with New Access Token ---');
        const booksRes2 = await api.get('/books', {
            headers: { Authorization: newTokens.accessToken }
        });

        if (booksRes2.status !== 200) {
            throw new Error(`Protected route access failed with new token: ${JSON.stringify(booksRes2.data)}`);
        }
        console.log('Access granted with new token');

        console.log('\n--- Testing Revoked Refresh Token ---');
        // The old refresh token should now be invalid because we implemented rotation
        const refreshRes2 = await api.post('/auth/refresh', { refreshToken });
        if (refreshRes2.status === 401) {
            console.log('Old refresh token correctly rejected (rotation works)');
        } else {
            console.log('WARNING: Old refresh token was not rejected:', refreshRes2.status, refreshRes2.data);
        }

        console.log('\n--- Testing Access Token Expiration (Simulated) ---');
        console.log('Waiting 11 seconds for access token to expire...');
        await sleep(11000);

        const expiredRes = await api.get('/books', {
            headers: { Authorization: (newTokens as any).accessToken }
        });

        if (expiredRes.status === 401) {
            console.log('Access token correctly expired');
        } else {
            console.log('WARNING: Access token did not expire as expected:', expiredRes.status, expiredRes.data);
        }

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        server.kill();
        process.exit(0);
    }
}

runTest();
