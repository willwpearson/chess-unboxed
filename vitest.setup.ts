import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest.config.mts sets test.globals: false, so React Testing Library's
// automatic per-test-framework cleanup detection never fires — without this,
// components rendered in one test (e.g. a Modal) stay mounted into the next.
afterEach(() => {
  cleanup();
});

// src/lib/jwt.ts resolves its secret at import time and throws if JWT_SECRET
// is unset outside dev mode — set both so importing auth code in tests never
// crashes before a test even gets to run.
process.env.JWT_SECRET ??= 'test-jwt-secret-do-not-use-in-production';
process.env.NEXT_PUBLIC_DEV_MODE ??= 'true';
