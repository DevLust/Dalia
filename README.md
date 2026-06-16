# Dália Ateliê de Noivas

Sistema de gestão para ateliê de noivas — clientes, acervo, pedidos, agenda, costureiras e relatórios.

**Stack:** React 19 · Vite 8 · TypeScript · Supabase · Vercel

Repositório: [github.com/DevLust/Dalia](https://github.com/DevLust/Dalia)

## Requisitos

- Node.js 20+
- Projeto [Supabase](https://supabase.com) (obrigatório em produção)

## Instalação local

```bash
npm install
cp .env.example .env
# Edite .env com URL e chave anon do Supabase
npm run dev
```

Sem `.env`, o app roda em modo local com `localStorage` e login de desenvolvimento (somente `npm run dev`).

## Produção — checklist

### 1. Supabase

1. Crie o projeto e as tabelas (schema privado do seu ambiente).
2. Execute no SQL Editor:
   - `docs/supabase-add-imagens.sql` — galeria de fotos
   - `docs/supabase-production.sql` — Auth + remoção de senha em texto
3. Em **Authentication → Users**, crie cada usuário (e-mail + senha forte).
4. Garanta um registro em `usuarios` com o **mesmo e-mail** e papel (`administrador`, `gerente`, etc.).

### 2. Vercel

Variáveis em **Settings → Environment Variables** (Production, Preview, Development):

| Nome | Valor |
|------|--------|
| `VITE_SUPABASE_URL` | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | Chave **anon** pública |

Depois: **Deployments → Redeploy** (o Vite embute as variáveis no build).

### 3. Build

```bash
npm run build
npm run preview   # testar build localmente
```

## Segurança

- Login em produção via **Supabase Auth** (sem senha na tabela `usuarios`).
- `.env` nunca vai para o Git.
- Use apenas a chave **anon** no front-end.
- Revise políticas **RLS** no Supabase.

## Licença

Uso privado — DevLust.
