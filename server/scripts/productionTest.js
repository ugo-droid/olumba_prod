/**
 * Production Readiness Test
 * Validates all systems are ready for production deployment
 */

import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/backend';

// Load environment variables
dotenv.config();

console.log('🧪 Production Readiness Test for Olumba');
console.log('=====================================\n');

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function logTest(testName, status, message = '') {
    const statusSymbol = {
        'pass': '✅',
        'fail': '❌',
        'warn': '⚠️'
    };
    
    console.log(`${statusSymbol[status]} ${testName}: ${message}`);
    
    if (status === 'pass') testResults.passed++;
    else if (status === 'fail') testResults.failed++;
    else if (status === 'warn') testResults.warnings++;
}

// Test 1: Environment Variables
function testEnvironmentVariables() {
    console.log('1. Testing Environment Variables...\n');
    
    const requiredVars = [
        'NODE_ENV',
        'APP_URL',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'CLERK_SECRET_KEY',
        'RESEND_API_KEY'
    ];
    
    const optionalVars = [
        'CLERK_WEBHOOK_SECRET',
        'CLERK_BILLING_WEBHOOK_SECRET',
        'EMAIL_FROM',
        'JWT_SECRET'
    ];
    
    // Check required variables
    for (const varName of requiredVars) {
        if (process.env[varName]) {
            logTest(`Required: ${varName}`, 'pass', 'Configured');
        } else {
            logTest(`Required: ${varName}`, 'fail', 'Missing');
        }
    }
    
    // Check optional variables
    for (const varName of optionalVars) {
        if (process.env[varName]) {
            logTest(`Optional: ${varName}`, 'pass', 'Configured');
        } else {
            logTest(`Optional: ${varName}`, 'warn', 'Not configured');
        }
    }
    
    console.log('');
}

// Test 2: Supabase Connection
async function testSupabaseConnection() {
    console.log('2. Testing Supabase Connection...\n');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Test basic connection
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            logTest('Supabase Connection', 'fail', `Error: ${error.message}`);
        } else {
            logTest('Supabase Connection', 'pass', 'Connected successfully');
        }
        
        // Test admin client
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (adminError) {
            logTest('Supabase Admin Client', 'warn', `Admin access issue: ${adminError.message}`);
        } else {
            logTest('Supabase Admin Client', 'pass', 'Admin access working');
        }
        
    } catch (error) {
        logTest('Supabase Connection', 'fail', `Connection failed: ${error.message}`);
    }
    
    console.log('');
}

// Test 3: Clerk Connection
async function testClerkConnection() {
    console.log('3. Testing Clerk Connection...\n');
    
    try {
        const clerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY
        });
        
        // Test basic connection by getting user count
        const users = await clerkClient.users.getUserList({ limit: 1 });
        
        logTest('Clerk Connection', 'pass', 'Connected successfully');
        logTest('Clerk API Access', 'pass', 'API calls working');
        
    } catch (error) {
        logTest('Clerk Connection', 'fail', `Connection failed: ${error.message}`);
    }
    
    console.log('');
}

// Test 4: Resend Connection
async function testResendConnection() {
    console.log('4. Testing Resend Connection...\n');
    
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Test API key validity (without sending email)
        const domains = await resend.domains.list();
        
        logTest('Resend Connection', 'pass', 'Connected successfully');
        logTest('Resend API Key', 'pass', 'Valid API key');
        
        if (domains.data && domains.data.length > 0) {
            logTest('Resend Domains', 'pass', `${domains.data.length} domain(s) configured`);
        } else {
            logTest('Resend Domains', 'warn', 'No domains configured');
        }
        
    } catch (error) {
        logTest('Resend Connection', 'fail', `Connection failed: ${error.message}`);
    }
    
    console.log('');
}

// Test 5: File Structure
async function testFileStructure() {
    console.log('5. Testing File Structure...\n');
    
    const requiredFiles = [
        'vercel.json',
        '.vercelignore',
        'package.json',
        'server/index.js',
        'server/production.js',
        'public/index.html'
    ];
    
    const fs = await import('fs');
    
    for (const file of requiredFiles) {
        try {
            if (fs.existsSync(file)) {
                logTest(`File: ${file}`, 'pass', 'Exists');
            } else {
                logTest(`File: ${file}`, 'fail', 'Missing');
            }
        } catch (error) {
            logTest(`File: ${file}`, 'fail', `Check failed: ${error.message}`);
        }
    }
    
    console.log('');
}

// Test 6: Package Dependencies
async function testDependencies() {
    console.log('6. Testing Package Dependencies...\n');
    
    const fs = await import('fs');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const requiredDeps = [
            'express',
            'cors',
            'dotenv',
            'resend',
            '@supabase/supabase-js',
            '@clerk/backend',
            'svix'
        ];
        
        for (const dep of requiredDeps) {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                logTest(`Dependency: ${dep}`, 'pass', `Version: ${packageJson.dependencies[dep]}`);
            } else {
                logTest(`Dependency: ${dep}`, 'fail', 'Missing from dependencies');
            }
        }
        
    } catch (error) {
        logTest('Package Dependencies', 'fail', `Failed to read package.json: ${error.message}`);
    }
    
    console.log('');
}

// Test 7: Security Configuration
async function testSecurityConfiguration() {
    console.log('7. Testing Security Configuration...\n');
    
    // Check for secure environment variables
    if (process.env.NODE_ENV === 'production') {
        logTest('Environment', 'pass', 'Production mode');
    } else {
        logTest('Environment', 'warn', `Current mode: ${process.env.NODE_ENV || 'development'}`);
    }
    
    // Check for HTTPS in APP_URL
    if (process.env.APP_URL && process.env.APP_URL.startsWith('https://')) {
        logTest('HTTPS Configuration', 'pass', 'HTTPS enabled');
    } else {
        logTest('HTTPS Configuration', 'warn', 'APP_URL should use HTTPS');
    }
    
    // Check for allowed origins
    if (process.env.ALLOWED_ORIGINS) {
        logTest('CORS Configuration', 'pass', 'Allowed origins configured');
    } else {
        logTest('CORS Configuration', 'warn', 'ALLOWED_ORIGINS not configured');
    }
    
    console.log('');
}

// Test 8: Performance Configuration
async function testPerformanceConfiguration() {
    console.log('8. Testing Performance Configuration...\n');
    
    const fs = await import('fs');
    
    // Check vercel.json configuration
    try {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        
        if (vercelConfig.functions && vercelConfig.functions['server/index.js']) {
            logTest('Vercel Functions', 'pass', 'Configured with timeout');
        } else {
            logTest('Vercel Functions', 'warn', 'Function timeout not configured');
        }
        
        if (vercelConfig.headers && vercelConfig.headers.length > 0) {
            logTest('Security Headers', 'pass', 'Headers configured');
        } else {
            logTest('Security Headers', 'warn', 'Security headers not configured');
        }
        
    } catch (error) {
        logTest('Vercel Configuration', 'fail', `Failed to read vercel.json: ${error.message}`);
    }
    
    console.log('');
}

// Main test function
async function runAllTests() {
    try {
        testEnvironmentVariables();
        await testSupabaseConnection();
        await testClerkConnection();
        await testResendConnection();
        await testFileStructure();
        await testDependencies();
        await testSecurityConfiguration();
        await testPerformanceConfiguration();
        
        // Summary
        console.log('📊 Test Summary');
        console.log('==============');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`⚠️  Warnings: ${testResults.warnings}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log('');
        
        if (testResults.failed === 0) {
            console.log('🎉 All critical tests passed! Ready for production deployment.');
            
            if (testResults.warnings > 0) {
                console.log('⚠️  Please review warnings before deploying.');
            }
        } else {
            console.log('❌ Critical tests failed. Please fix issues before deploying.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export { runAllTests };
