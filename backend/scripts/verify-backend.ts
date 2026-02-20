import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({
    baseURL: 'http://localhost:8080/api',
    jar,
    withCredentials: true
}));

async function runTests() {
    console.log('🚀 Starting Backend Verification...\n');

    try {
        // 1. Health Check
        console.log('1. Health Check...');
        const health = await axios.get('http://localhost:8080/health');
        console.log('✅ Health Check Passed:', health.data.data.status);

        // 2. Authentication Flow
        console.log('\n2. Authentication Flow...');

        // Cleanup previous test user if exists (optional, might fail if not exists)
        // For now assuming clean DB or handling errors gracefully

        const testUser = {
            email: `test${Date.now()}@example.com`,
            password: 'Password123!',
            name: 'Test User'
        };

        console.log('   - Signing up user:', testUser.email);
        const signup = await client.post('/auth/signup', testUser);
        console.log('✅ Signup Successful');

        console.log('   - Logging in...');
        const login = await client.post('/auth/login', {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login Successful');

        console.log('   - Getting current user profile...');
        const me = await client.get('/auth/me');
        console.log('✅ Profile Retrieved:', me.data.data.user.email);
        const userId = me.data.data.user.id;

        // Create Admin User (Mocking via direct DB or endpoint if valid)
        // Since we can't easily make ourselves admin via API without a secret or pre-existing admin,
        // we might need to rely on the `create-admin` endpoint if it's open or use a seed.
        // However, the `create-admin` endpoint is likely protected or requires a specific secret.
        // Let's check `auth.controller.ts` for `createAdmin`.

        // 3. Products Flow
        console.log('\n3. Products Flow...');
        console.log('   - Listing products...');
        const products = await client.get('/products');
        console.log('✅ Products Listed:', products.data.data.products.length);

        // 4. Coupons (Public)
        console.log('\n4. Coupons Flow...');
        console.log('   - Validating non-existent coupon...');
        try {
            await client.post('/coupons/validate', { code: 'INVALID' });
        } catch (e: any) {
            console.log('✅ Invalid Coupon Rejected:', e.response?.data?.message || e.message);
        }

        // 5. Settings (Public/Protected?)
        // Settings are protected. We can't access them as a normal user.

        console.log('\n✅ Basic User Flow Verified!');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTests();
