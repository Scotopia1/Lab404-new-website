/**
 * Test Customer Profile API
 * Simulates getting customer profile data
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function testProfileAPI() {
  const email = 'johnnyjneid@gmail.com';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n🔍 Testing Profile API for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Get customer - simulate what the API does
    const [customer] = await client`
      SELECT
        id,
        email,
        first_name,
        last_name,
        phone,
        order_count,
        created_at
      FROM customers
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (!customer) {
      console.log('❌ Customer not found\n');
      return;
    }

    console.log('📋 Raw Database Response:');
    console.log(JSON.stringify(customer, null, 2));
    console.log('');

    // Transform to camelCase like the API does
    const apiResponse = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      orderCount: customer.order_count,
      createdAt: customer.created_at,
    };

    console.log('📤 API Response (after camelCase transform):');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('');

    // Check for null/empty values
    console.log('🔍 Field Validation:');
    console.log(`   ✅ id: ${apiResponse.id ? '✓' : '✗ EMPTY'}`);
    console.log(`   ${apiResponse.email ? '✅' : '❌'} email: ${apiResponse.email || 'EMPTY'}`);
    console.log(`   ${apiResponse.firstName ? '✅' : '❌'} firstName: ${apiResponse.firstName || 'EMPTY'}`);
    console.log(`   ${apiResponse.lastName ? '✅' : '❌'} lastName: ${apiResponse.lastName || 'EMPTY'}`);
    console.log(`   ${apiResponse.phone ? '✅' : '⚠️ '} phone: ${apiResponse.phone || 'NULL (optional)'}`);
    console.log(`   ${apiResponse.orderCount !== null ? '✅' : '❌'} orderCount: ${apiResponse.orderCount}`);
    console.log(`   ${apiResponse.createdAt ? '✅' : '❌'} createdAt: ${apiResponse.createdAt || 'EMPTY'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testProfileAPI();
