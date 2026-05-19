# Dália Ateliê de Noivas

Sistema de gestão para ateliê de noivas — clientes, acervo, pedidos, agenda, costureiras e relatórios.

**Stack:** React 19 · Vite 8 · TypeScript · Supabase (opcional) · deploy na Vercel

Repositório: [github.com/DevLust/Dalia](https://github.com/DevLust/Dalia)

## Requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) (recomendado para produção)

## Instalação

```bash
npm install
cp .env.example .env
# Edite .env com URL e chave anon do Supabase
```

Execute o SQL em `supabase/schema.sql` no editor SQL do Supabase (cria tabelas e dados iniciais).

## Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`.

**Login de demonstração** (após rodar o schema): `admin@dalia.com.br` / `admin123`  
Altere essa senha em produção.

Sem `.env` configurado, o app usa `localStorage` como fallback local.

## Build e deploy

```bash
npm run build
```

Saída em `dist/`. Na Vercel, configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do projeto (não no código).

## Segurança

- `.env` e chaves **nunca** devem ir para o Git
- Use apenas a chave **anon** (pública) no front-end
- Revise as políticas RLS no Supabase antes de produção

## Licença

Uso privado — DevLust.
