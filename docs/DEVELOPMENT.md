# Development Guide

## Project Structure

```
hasebny-payroll-system/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and business logic
│   ├── types/            # TypeScript types
│   └── ai/               # AI integration with Genkit
├── wasm-payroll/         # Rust WebAssembly payroll calculator
├── docs/                 # Documentation
└── .github/workflows/    # CI/CD workflows
```

## Getting Started

### Prerequisites

1. Node.js 20+
2. Rust and Cargo (for WASM development)
3. wasm-pack (`cargo install wasm-pack`)

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:9002

## Testing

### Running Tests

Currently, tests are run manually. In the future, we'll implement:

```bash
npm test
```

### Test Structure

Tests are located in:
- `src/lib/*.test.ts` - Unit tests for business logic
- `src/components/**/*.test.tsx` - Component tests

## WebAssembly Payroll Module

### Building the WASM Module

1. Navigate to the `wasm-payroll` directory
2. Run the build script:
   - On Unix systems: `./build.sh`
   - On Windows systems: `build.bat`

This will compile the Rust code to WebAssembly and place the output in `src/lib/wasm/`.

### WASM Module Structure

```
wasm-payroll/
├── Cargo.toml          # Rust project configuration
├── src/
│   └── lib.rs          # Rust source code
├── build.sh            # Build script for Unix systems
└── build.bat           # Build script for Windows systems

src/lib/wasm/           # Compiled WebAssembly output
├── payroll_wasm.js     # JavaScript bindings
└── payroll_wasm_bg.wasm # WebAssembly binary
```

## Financial Calculations

### Precision Handling

All monetary calculations should use fixed-point arithmetic to avoid floating-point precision issues:

1. **Current Implementation**: Uses JavaScript numbers (floating-point)
2. **Improved Implementation**: Uses integer-based calculations in `src/lib/utils-precision.ts`
3. **Alternative**: Use a decimal library like `decimal.js` or `big.js`
4. **Future Enhancement**: Work in cents (integers) and convert for display

### Rounding Rules

All calculations are rounded to 2 decimal places using `parseFloat(value.toFixed(2))`.

## Firebase Integration

### Security Rules

Firebase security rules should be configured to:
1. Only allow admins to modify payroll data
2. Only allow employees to view their own data
3. Prevent unauthorized access to sensitive information

Security rules are defined in `firebase.rules`.

### Data Structure

```
employees/                  # Employee master data
  {employeeId}/
    name, jobTitle, department, hireDate, basicSalary, ...

salaries_{year}_{month}/    # Monthly payroll data
  {employeeId}/
    grossSalary, totalDeductions, netSalary, ...

leaveRequests/              # Leave management
  {employeeId}/
    {requestId}/
      startDate, endDate, leaveType, status, ...

attendance_{year}_{month}/  # Daily attendance tracking
  {employeeId}/
    {day}/
      status, in, out, regularHours, overtimeHours
```

## Audit Logging

All modifications to payroll data are logged using the audit logging system in `src/lib/audit-logger.ts`.

### Logged Actions

1. Employee data modifications
2. Payroll calculations and adjustments
3. Leave request submissions and approvals
4. Attendance record changes

## Contributing

### Code Style

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Maintain consistent naming conventions
4. Write clear, self-documenting code

### Git Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Follow the code style guidelines
4. Get code review from team members