# 🔍 Próximos Passos para Verificar o Pagamento

## Status Atual

✅ **Pagamento Mercado Pago**: Aprovado (ID: 163754725356)
- Usuário: r9teHDRvhVRTHG2JGVOI2Fr9g1o2
- Plano: anual
- Email: andreconteudoia@gmail.com

⚠️ **Firestore**: Erro 500 no endpoint `/api/mercado-pago/verify` do Vercel

---

## Como Verificar se Firestore foi Atualizado

### Opção 1: Firebase Console (Mais direto)

1. Acesse: [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto: **gen-lang-client-0647760479**
3. Vá para: **Firestore Database**
4. Procure a coleção: **users**
5. Abra o documento: **r9teHDRvhVRTHG2JGVOI2Fr9g1o2**
6. Verifique os campos:
   - **planType** → deve ser `"anual"` ✓
   - **paymentStatus** → deve ser `"approved"` ✓
   - **subscriptionExpiresAt** → deve ter data (~1 ano à frente) ✓
   - **paymentEmail** → deve ser `"andreconteudoia@gmail.com"` ✓

### Opção 2: Vercel Function Logs

1. Acesse: [Vercel Dashboard](https://vercel.com)
2. Selecione: **liderajovem** (projeto)
3. Clique: **Deployments** → (último) → **Function Logs**
4. Procure por erros em `/api/mercado-pago`:
   - Se vir `Pagamento Mercado Pago Aprovado`, quer dizer que funcionou ✓
   - Se vir erro de Firebase, compartilhe conosco

### Opção 3: Testar Webhook Manualmente

Se o webhook ainda não foi acionado, pode simular um POST:

```bash
curl -X POST https://liderajovem.vercel.app/api/mercado-pago/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "163754725356",
    "topic": "payment"
  }'
```

---

## Checklist de Debugging

- [ ] Firebase Console mostra documento atualizado?
- [ ] `paymentStatus === "approved"`?
- [ ] `planType === "anual"`?
- [ ] `subscriptionExpiresAt` está setado?
- [ ] Vercel logs mostram sucesso?
- [ ] Se não, qual é o erro no Vercel?

---

## Se o Documento NÃO foi Atualizado

**Causas possíveis:**

1. **FIREBASE_SERVICE_ACCOUNT_KEY vazio/inválido**
   - ✓ Verifique em Vercel > Settings > Environment Variables
   - Recopie a chave de serviço e refaça o upload

2. **Webhook não foi acionado**
   - Clique no link de sucesso novamente:
   - https://liderajovem.vercel.app/dashboard?pagamento=sucesso&payment_id=163754725356

3. **Permissões do Firebase restritas**
   - Verifique `firestore.rules` - deve permitir write no documento do usuário

---

## Próxima Ação Recomendada

👉 **Abra o Firebase Console e verifique o documento.**

Se não estiver atualizado, compartilhe os **logs do Vercel** para diagnosticar.
