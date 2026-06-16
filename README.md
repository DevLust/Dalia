# Dália Ateliê de Noivas

React · Vite · TypeScript · Supabase · Vercel

## Local

```bash
npm install
cp .env.example .env
npm run dev
```

## Produção

1. Execute `docs/supabase-setup.sql` no Supabase.
2. Vercel — variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Redeploy.

```bash
npm run build
```
