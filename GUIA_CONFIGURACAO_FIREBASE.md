# 🚀 Guia Prático: Como Conectar seu Projeto Firebase Externo (Parte 1)

Este guia foi criado especialmente para você conectar o **AsphaltPro ERP** ao seu projeto Firebase existente em **qualquer outra conta Google/Firebase**, sem precisar alterar o código-fonte manualmente ou depender da conta atual do chat.

---

## 📌 1. Quais dados você precisa pegar no seu Firebase?

Acesse o console da sua conta do Firebase: **[https://console.firebase.google.com](https://console.firebase.google.com)**

1. Abra o seu projeto do Firebase.
2. No canto superior esquerdo, clique no ícone de engrenagem ⚙️ ao lado de *Visão geral do projeto* e selecione **Configurações do projeto**.
3. Na aba **Geral**, desça a página até a seção **Seus aplicativos**.
4. Se já tiver um app Web cadastrado (ícone `</>`), selecione **Configuração**. Se não tiver, clique em **Adicionar app** > Web `</>`, dê um apelido (ex: `asphaltpro-erp`) e confirme.
5. Você verá um bloco de código parecido com este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-EXEMPLO-SUA-CHAVE-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

## 📌 2. Onde colocar essas variáveis? (2 Formas Fáceis)

Você tem **duas formas** de conectar. Escolha a que preferir:

### Opção A: Direto na Tela do Sistema (Sem mexer em código!)
1. Abra o AsphaltPro ERP.
2. Vá no menu **Configurações** (ou clique no ícone de nuvem no canto superior direito).
3. Abra a aba **Sincronização em Nuvem** > **Conectar Firebase**.
4. Preencha os campos com os dados copiados do seu Firebase:
   - **Project ID**: `seu-projeto`
   - **API Key**: `AIzaSyD...`
   - **Auth Domain**: `seu-projeto.firebaseapp.com`
   - **Storage Bucket**: `seu-projeto.appspot.com`
   - **App ID**: `1:...`
5. Clique em **Salvar Credenciais** e depois em **Testar Conexão**. O sistema fará um teste de 1 ping com 0ms de impacto de quota!

---

### Opção B: Através de Variáveis de Ambiente (Vercel / Arquivo `.env`)
Se você for publicar na Vercel ou rodar localmente com arquivo `.env`, adicione estas variáveis:

```env
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_API_KEY=AIzaSyD-EXEMPLO-SUA-CHAVE-AQUI
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

> **Nota:** Todas as variáveis para o frontend Vite começam com o prefixo `VITE_`. O sistema já está 100% programado em `src/services/firebaseConfig.ts` para ler automaticamente essas variáveis se existirem!

---

## 📌 3. Como Ativar o Banco Firestore no seu Firebase

1. No menu lateral do Firebase Console, clique em **Criação** > **Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha o local do servidor (Recomendado: `southamerica-east1` em São Paulo, ou `us-central1`).
4. Pode iniciar em modo de produção.

### Publicando as Regras de Segurança:
1. No Firestore Database, clique na aba **Regras** (Rules).
2. Apague o que estiver lá e cole todo o conteúdo do arquivo **`firestore.rules`** que criamos no projeto.
3. Se o e-mail da sua conta Firebase for diferente de `littlefigther50@gmail.com`, você pode alterar na linha 31 do arquivo:
   ```javascript
   request.auth.token.email == 'seu-email-da-outra-conta@gmail.com' ||
   ```
4. Clique no botão azul **Publicar** (Publish). Pronto! As regras Zero-Trust estarão ativas.

---

## 📌 4. Como Ativar o Firebase Authentication (Logins)

1. No menu lateral do Firebase Console, clique em **Criação** > **Authentication**.
2. Clique em **Vamos começar**.
3. Na aba **Sign-in method** (Métodos de login), ative:
   - **Google**: Clique em Google, habilite a chave, defina o e-mail de suporte do projeto e salve.
   - **E-mail/senha**: Clique em E-mail/senha, habilite a primeira opção e salve.
4. Na aba **Configurações** > **Domínios autorizados**, verifique se o domínio do seu app (ou `localhost`) está listado. Se publicar na Vercel ou domínio próprio, adicione o domínio lá (ex: `meusistema.vercel.app`).

---

## 📌 5. Como Definir seu Administrador Geral

O sistema possui proteção de dois níveis para o Administrador:
1. **Nível 1 (E-mail Mestre):** O e-mail configurado na regra do Firestore (`request.auth.token.email`) é automaticamente reconhecido como Administrador pelo servidor do Google, independente de qualquer coisa.
2. **Nível 2 (Papel no Banco):** No menu **Configurações > Usuários**, qualquer usuário marcado com o papel **Diretoria (Admin)** tem acesso administrativo total no sistema para autorizar orçamentos, liberar outros operadores e alterar permissões.

---

Toda a infraestrutura da **Parte 1 (Regras, Otimização e Conexão de Credenciais)** está concluída e pronta para você plugar o seu projeto quando desejar!
