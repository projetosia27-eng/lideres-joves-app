<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9b77432b-ddce-4306-8700-63a5100592b9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mercado Pago: Forçar URL de sucesso do frontend

Este projeto suporta forçar o redirecionamento de sucesso do Mercado Pago para o frontend público usando a variável de ambiente `FRONTEND_SUCCESS_URL`.

- Adicione em seu ambiente (ex.: Vercel, Cloud Run):

```
FRONTEND_SUCCESS_URL=https://liderajovem.vercel.app/
```

## Testar localmente a construção de `back_urls`

Há um script de teste simples em `scripts/test-create-pref.js` que emula a construção de `back_urls` usada ao criar uma preferência Mercado Pago. Para executá-lo:

Sem `FRONTEND_SUCCESS_URL` definido (usa `clientOrigin` ou `APP_URL`):

```powershell
node scripts/test-create-pref.js userId=r9te... clientOrigin="http://localhost:3000"
```

Com `FRONTEND_SUCCESS_URL` definido (força a URL pública):

```powershell
$env:FRONTEND_SUCCESS_URL='https://liderajovem.vercel.app/'; node scripts/test-create-pref.js userId=r9te... clientOrigin="http://localhost:3000"
```

