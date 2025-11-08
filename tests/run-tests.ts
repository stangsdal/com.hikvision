#!/usr/bin/env node
/**
 * Test Runner for Hikvision Camera Device
 * Executes the comprehensive test framework
 */

import { runHikvisionTests } from './device-test-framework';

async function main() {
  try {
    console.log('🧪 Hikvision Camera Test Runner');
    console.log('==============================\n');
    
    await runHikvisionTests();
    
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}