# E2E Test User Documentation

## Test Account Credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | `e2e-test@evidenra.com`  |
| Password | `TestPassword123!`       |
| User ID  | `9f15ca5f-7e8e-4630-9e22-e878ceb8a4e5` |

## Supabase Configuration

- **URL:** `https://zvkoulhziksfxnxkkrmb.supabase.co`
- **Anon Key:** (see `create-test-user.mjs`)

## Scripts

### Create/Verify Test User
```bash
cd apps/web
node tests/e2e/create-test-user.mjs
```

### Run Tests with Auto-Login
```bash
cd apps/web

# Comprehensive click test
npx playwright test click-everything.spec.ts --headed --project=chromium-no-auth

# Smoke test
npx playwright test smoke.spec.ts --headed

# All E2E tests
npx playwright test --headed
```

## Test Files

| File | Description |
|------|-------------|
| `click-everything.spec.ts` | Clicks EVERY button on every page |
| `all-buttons.spec.ts` | Tests all buttons including AKIH tab |
| `smoke.spec.ts` | Quick smoke test |
| `auth-setup.spec.ts` | Manual login and session save |
| `helpers.ts` | Shared test utilities |
| `create-test-user.mjs` | Creates test user in Supabase |

## Notes

- The test user was created in the production Supabase database
- OAuth (Google/GitHub) is available but not used for automated tests
- The test user has no special permissions - regular user role
- Email confirmation is disabled for this test account

## Skipped Actions

The test automatically skips:
- **Dangerous:** Delete, Logout, Remove account
- **Navigation:** Upgrade, Pricing, OAuth buttons, Import dialogs

## Troubleshooting

### Login fails
```bash
# Verify account exists
node tests/e2e/create-test-user.mjs
```

### Browser closes unexpectedly
- Check if clicked element opens external link
- Add pattern to `SKIP_NAVIGATION` array in test file

### Test timeout
- Increase timeout: `--timeout=600000`
- Run with debug: `npx playwright test --debug`
