# Path Alias Configuration

This document describes how to configure module-alias for Clean Architecture path aliases.

## 1. Install module-alias

```bash
npm install module-alias
npm install --save-dev @types/node
```

## 2. Configure tsconfig.json

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

## 3. Configure package.json

Add the following to your `package.json`:

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "_moduleAliases": {
    "@": "dist"
  }
}
```

## 4. Import in entry point

The entry point (`src/main/server.ts`) should import module-alias at the top:

```typescript
import 'module-alias/register'
```

✅ This configuration is complete and already implemented in step-20.
