# MUI Integration Guide

This document explains how Material-UI (MUI) has been integrated into the Hasebny Payroll System.

## Installation

MUI has been installed with the following packages:
- `@mui/material`: Core MUI components
- `@emotion/react`: CSS-in-JS library for styling
- `@emotion/styled`: Styled API for Emotion
- `@mui/icons-material`: Material icons
- `stylis` and `stylis-plugin-rtl`: For RTL support

## Configuration

### Theme
The theme is configured in `src/lib/mui-theme.ts` to match the existing design system:
- Colors aligned with Tailwind configuration
- Cairo font as the primary font
- RTL direction support
- Border radius matching existing components

### Provider
MUI is provided at the application level through `src/components/MUIProvider.tsx` which:
- Wraps the application with ThemeProvider
- Provides RTL support through CacheProvider
- Includes CssBaseline for consistent base styles

## Usage

### Basic Usage
To use MUI components in any component:

```tsx
'use client'; // Required for MUI components

import { Button, TextField } from '@mui/material';

export default function MyComponent() {
  return (
    <div>
      <TextField label="اسم الموظف" variant="outlined" />
      <Button variant="contained" color="primary">
        حفظ
      </Button>
    </div>
  );
}
```

### Available Components
All MUI components are available. Some commonly used ones include:
- Buttons (`Button`)
- Form controls (`TextField`, `Select`, `Checkbox`, etc.)
- Layout (`Card`, `Paper`, `Box`)
- Navigation (`Tabs`, `Drawer`, `AppBar`)
- Data display (`Typography`, `Table`, `List`)
- Feedback (`Alert`, `Snackbar`, `Dialog`)

### RTL Support
RTL is automatically handled through the configuration. No additional setup is needed.

### Theme Customization
The theme can be customized by modifying `src/lib/mui-theme.ts`. Changes will affect all MUI components throughout the application.

## Example Implementation
See `src/app/mui-demo/page.tsx` for a complete example of using MUI components with the configured theme.

## Best Practices

1. Always add `'use client'` at the top of files using MUI components
2. Use the existing theme colors to maintain consistency
3. Prefer MUI components over custom implementations when possible
4. Use MUI's built-in responsive utilities
5. Leverage MUI's accessibility features

## Compatibility
MUI has been configured to work alongside the existing Tailwind CSS and Radix UI components without conflicts.