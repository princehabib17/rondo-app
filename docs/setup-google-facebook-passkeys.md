# Set up Google, Facebook, and Passkeys (biometrics)

App URL: `https://rondo-app.vercel.app`  
Login page: https://rondo-app.vercel.app/login  
Auth callback: `https://rondo-app.vercel.app/auth/callback`

## Direct links

| Step | Open this |
|------|-----------|
| 1. Your Supabase projects | https://supabase.com/dashboard/projects |
| 2. Auth providers (Google / Facebook) | https://supabase.com/dashboard/project/_/auth/providers |
| 3. Google OAuth credentials | https://console.cloud.google.com/apis/credentials |
| 4. Facebook apps | https://developers.facebook.com/apps/ |
| 5. Passkeys docs (if dashboard label differs) | https://supabase.com/docs/guides/auth/passkeys |
| 6. Test login | https://rondo-app.vercel.app/login |
| PayMongo dashboard (payments) | https://dashboard.paymongo.com/ |

Replace `_` in Supabase URLs by opening your project first from the projects list, then Auth → Providers / Passkeys.

## Terminal wizard (optional)

```bash
./scripts/setup-google-facebook-passkeys.sh
```

Opens each link and waits for you between steps.

## GCash / Maya — honest status

- **Wallet top-up today:** PayMongo checkout already requests `gcash` and `maya` (plus card). So topping up the wallet *can* use GCash/Maya when PayMongo keys + methods are active on your PayMongo account.
- **Pay a match fee directly (skip wallet):** **not built yet.** Match pay is wallet-only right now. Optional “pay this game with GCash/Maya” is the next payment build after login works.
