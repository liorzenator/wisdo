import http from 'k6/http';
import { check, sleep } from 'k6';

// --- Configuration ---
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN; // pass via CLI: k6 run -e ACCESS_TOKEN=Bearer xxx

export const options = {
    stages: [
        { duration: '30s', target: 20 },   // ramp up to 20 users
        { duration: '1m',  target: 20 },   // hold at 20
        { duration: '30s', target: 100 },  // spike to 100
        { duration: '1m',  target: 100 },  // hold at 100
        { duration: '30s', target: 0 },    // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
        http_req_failed:   ['rate<0.01'],  // less than 1% errors
    },
};

export default function () {
    const res = http.get(`${BASE_URL}/feed`, {
        headers: { Authorization: ACCESS_TOKEN },
    });

    check(res, {
        'status is 200':       (r) => r.status === 200,
        'response under 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}