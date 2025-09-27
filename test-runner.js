// Simple test runner to verify our tests work
console.log('Running payroll calculation tests...');

// Import the calculatePayroll function
const { calculatePayroll } = require('./src/lib/utils');

// Mock the Worker type
const worker = {
  id: '1',
  name: 'Test Employee',
  role: 'employee',
  basicSalary: 3000,
  housing: 0,
  workNature: 0,
  transport: 0,
  phone: 0,
  food: 0,
  days: {},
};

const result = calculatePayroll(worker, 2023, 1);

console.log('Test result:', result);

// Simple assertion
if (result.grossSalary === 3000) {
  console.log('✓ Basic salary test passed');
} else {
  console.log('✗ Basic salary test failed');
}

if (result.netSalary === 3000) {
  console.log('✓ Net salary test passed');
} else {
  console.log('✗ Net salary test failed');
}

console.log('Test runner completed');