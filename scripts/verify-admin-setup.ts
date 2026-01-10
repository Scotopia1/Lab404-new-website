/**
 * Verify Admin Setup
 *
 * Verifies that the admin setup completed successfully without data loss
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function verifySetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('\n🔍 Verifying Admin Setup...\n');

  const client = neon(databaseUrl);

  try {
    // Check total customer count
    const totalCount = await client`
      SELECT COUNT(*) as count FROM customers
    `;
    console.log(`📊 Total Customers: ${totalCount[0].count}`);

    // Check role distribution
    const roleDistribution = await client`
      SELECT role, COUNT(*) as count
      FROM customers
      GROUP BY role
      ORDER BY role
    `;
    console.log('\n📈 Role Distribution:');
    roleDistribution.forEach(row => {
      console.log(`   ${row.role === 'admin' ? '🔐' : '👤'} ${row.role}: ${row.count}`);
    });

    // Check admin users
    const admins = await client`
      SELECT email, first_name, last_name, is_active, email_verified, created_at
      FROM customers
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `;

    console.log('\n👑 Admin Users:');
    admins.forEach((admin, index) => {
      const name = [admin.first_name, admin.last_name].filter(Boolean).join(' ') || 'N/A';
      console.log(`   ${index + 1}. ${admin.email}`);
      console.log(`      Name: ${name}`);
      console.log(`      Active: ${admin.is_active ? '✅' : '❌'}`);
      console.log(`      Verified: ${admin.email_verified ? '✅' : '❌'}`);
      console.log(`      Created: ${new Date(admin.created_at).toISOString()}`);
    });

    // Check for any issues
    console.log('\n🔍 Data Integrity Checks:');

    const nullRoles = await client`
      SELECT COUNT(*) as count FROM customers WHERE role IS NULL
    `;
    console.log(`   ✓ Customers with NULL role: ${nullRoles[0].count}`);

    const invalidRoles = await client`
      SELECT COUNT(*) as count FROM customers WHERE role NOT IN ('customer', 'admin')
    `;
    console.log(`   ✓ Customers with invalid role: ${invalidRoles[0].count}`);

    const guestAdmins = await client`
      SELECT COUNT(*) as count FROM customers WHERE role = 'admin' AND is_guest = true
    `;
    console.log(`   ✓ Guest admin accounts (should be 0): ${guestAdmins[0].count}`);

    const inactiveAdmins = await client`
      SELECT COUNT(*) as count FROM customers WHERE role = 'admin' AND is_active = false
    `;
    console.log(`   ✓ Inactive admin accounts: ${inactiveAdmins[0].count}`);

    const unverifiedAdmins = await client`
      SELECT COUNT(*) as count FROM customers WHERE role = 'admin' AND email_verified = false
    `;
    console.log(`   ✓ Unverified admin accounts: ${unverifiedAdmins[0].count}`);

    // Final verdict
    const hasIssues =
      Number(nullRoles[0].count) > 0 ||
      Number(invalidRoles[0].count) > 0 ||
      Number(guestAdmins[0].count) > 0 ||
      admins.length === 0;

    if (hasIssues) {
      console.log('\n⚠️  WARNING: Some issues detected. Please review above.\n');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed! Admin setup completed successfully.\n');
      console.log('🎉 You can now login to the admin dashboard with your admin credentials.\n');
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySetup();
