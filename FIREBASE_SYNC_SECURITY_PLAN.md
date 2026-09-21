# Plano Diretor de Sincronização, Segurança e Autenticação Firebase (AsphaltPro ERP)

Este documento descreve o plano arquitetural e as implementações executadas para garantir sincronização em tempo real, segurança Zero-Trust (ABAC/RBAC), persistência offline avançada e gerenciamento de acessos no sistema.

---

## 📑 Índice de Módulos Implementados

1. **Parte 1: Matriz de Regras e Segurança Zero-Trust (`firestore.rules` & `firebase-blueprint.json`) [CONCLUÍDA ✅]**
2. **Parte 2: Autenticação Multi-Provedor (E-mail/Senha + Google Auth + Persistência de Sessão) [CONCLUÍDA ✅]**
3. **Parte 3: Otimização Extrema de Leituras e Listener Inteligente (`includeMetadataChanges: false`) [CONCLUÍDA ✅]**
4. **Parte 4: Gravações em Lote Atômicas (`writeBatch`) e Timestamps de Servidor (`serverTimestamp`) [CONCLUÍDA ✅]**
5. **Parte 5: Resolução Determinística de Conflitos Multi-Dispositivo (Versionamento e Tombstones) [CONCLUÍDA ✅]**

---

## 🛡️ Parte 1: Regras de Segurança no Firestore (`firestore.rules`)

### Arquitetura de Acesso
- **Default-Deny Catch-All**: Qualquer coleção não explicitamente autorizada tem leitura e escrita negadas por padrão.
- **Validação de Tipos e Limites**: Cada documento inserido ou atualizado valida tamanho de strings (`.size() <= max`), tipos numéricos positivos para valores monetários, enumerações para status e integridade temporal (`request.time`).
- **Coleções Monitoradas**:
  1. `/transactions/{transactionId}`: Lançamentos financeiros (entradas e saídas).
  2. `/accounts/{accountId}`: Contas a pagar e receber.
  3. `/quotes/{quoteId}`: Orçamentos e propostas comerciais técnicas.
  4. `/partners/{partnerId}`: Cadastro de clientes e fornecedores.
  5. `/employees/{employeeId}`: Cadastro de colaboradores e motoristas.
  6. `/categories/{categoryId}`: Categorias contábeis de receitas e despesas.
  7. `/bankAccounts/{bankAccountId}`: Contas bancárias e caixas operacionais.
  8. `/settings/{settingId}`: Configurações da usina, papel timbrado A4 e presets.
  9. `/users/{userId}`: Cadastro de perfis e permissões de acesso.
  10. `/_system_sync/{syncId}`: Documentos de heartbeat e verificação de integridade.

---

## 🔑 Parte 2: Autenticação Multi-Provedor e Mapeamento de UID [CONCLUÍDA ✅]

### Recursos de Autenticação Implementados:
- **Provedor Google**: `signInWithPopup` integrado com tratamento de domínios não autorizados e guia interativo com botão de cópia de domínio em 1 clique.
- **Provedor E-mail & Senha**: `loginWithFirebaseEmail` com chaveamento automático (tenta Firebase Auth online primeiro e faz fallback suave para credenciais locais caso esteja offline).
- **Cadastro de Novos Usuários**: `registerWithFirebaseEmail` permitindo auto-registro na tela de login com criação de conta no Firebase Auth e mapeamento automático de papel (`operador` por padrão e `admin` para o e-mail Master).
- **Recuperação de Senha**: `sendPasswordReset` conectado ao `sendPasswordResetEmail` do Firebase Auth, disparando link oficial para a caixa de entrada do colaborador.
- **Persistência de Sessão**: `browserLocalPersistence` ativo e listener em tempo real com `subscribeToFirebaseAuthState` que restaura a sessão automaticamente ao recarregar a página ou reabrir o app.
- **Mapeamento de UID & Whitelist**: Vínculo entre o `auth.currentUser.uid` do Firebase e o perfil de usuário interno (`SystemUser`), permitindo que a diretoria autorize novos usuários e defina papéis (`admin`, `financeiro`, `comercial`, `operador`).

---

## 📋 Guia de Configuração para o Usuário (Firebase & Vercel)

Como o projeto atual no Firebase está sob outra conta e já está conectado na Vercel, siga este checklist prático quando for realizar a troca ou conferência de permissões:

### 1. No Firebase Console (https://console.firebase.google.com):
1. **Ativar Métodos de Login (Authentication > Sign-in method)**:
   - **E-mail / Senha**: Ative o provedor "E-mail/senha" (a opção "Link do e-mail" não é necessária).
   - **Google**: Ative o provedor "Google", defina o e-mail de suporte (ex: `littlefigther50@gmail.com`) e salve.
2. **Autorizar Domínio da Vercel (Authentication > Settings > Authorized domains)**:
   - Clique em **Adicionar domínio** e informe a URL do seu aplicativo na Vercel (ex: `seu-app.vercel.app`).
   - Adicione também qualquer domínio customizado que você use (ex: `app.suausina.com.br`).
3. **Conta Administradora Master**:
   - O e-mail `littlefigther50@gmail.com` está configurado no código como e-mail de acesso Master direto. Ao fazer login com essa conta (seja via Google ou via E-mail cadastrado), o sistema concede automaticamente papel de **Diretor de Operações / Administrador Geral**.
4. **Regras do Firestore (Firestore Database > Rules)**:
   - Copie o conteúdo do arquivo `firestore.rules` deste projeto e cole na aba de Regras do seu console, clicando em **Publicar**.

### 2. No Painel da Vercel (Settings > Environment Variables):
Certifique-se de que as seguintes variáveis de ambiente estejam configuradas para os ambientes **Production** e **Preview**:
- `VITE_FIREBASE_PROJECT_ID`: ID do seu projeto Firebase (ex: `usina-asfalto-prod`)
- `VITE_FIREBASE_API_KEY`: Chave Web API (ex: `AIzaSy...`)
- `VITE_FIREBASE_AUTH_DOMAIN`: Domínio de auth (ex: `usina-asfalto-prod.firebaseapp.com`)
- `VITE_FIREBASE_STORAGE_BUCKET`: Bucket do Storage (ex: `usina-asfalto-prod.appspot.com`)

---

## ⚡ Parte 3: Otimização de Leituras e Economia de Quotas [CONCLUÍDA ✅]

### Estratégia de Consumo Mínimo de Quotas:
- **`includeMetadataChanges: false`**: Suprime disparos redundantes de re-renderização quando dados estão apenas em trânsito no cache local.
- **Cache-First Anti-Abuse**: Consultas locais via IndexedDB evitam requisições repetidas para documentos inalterados.
- **Heartbeat de Ping Único**: Teste de conexão consome estritamente 1 operação de escrita/leitura em vez de escanear coleções inteiras.

---

## 📦 Parte 4: Gravações Atômicas em Lote (`writeBatch`) e Timestamps [CONCLUÍDA ✅]

### Operações em Massa:
- **`syncBatchToFirestore`**: Agrupamento de até 450 operações por lote (respeitando a margem de segurança do limite de 500 do Firestore).
- **Consistência Relógio-Nuvem**: Uso de `serverTimestamp()` do Firestore para `_syncedAt` e `updatedAt`, eliminando divergências causadas por relógios descalibrados em celulares ou computadores de campo.

---

## 🔄 Parte 5: Resolução de Conflitos Multi-Dispositivo [CONCLUÍDA ✅]

### Estratégia de Versionamento e Tombstones:
- **Controle de Versão Incremental (`_version`)**: Cada alteração incrementa o número da versão do documento.
- **Resolução Last-Write-Wins (LWW)**: Se dois dispositivos editarem o mesmo registro simultaneamente, a versão com timestamp de servidor mais recente prevalece deterministicamente.
- **Tombstones de Exclusão (TTL 48h)**: Registros deletados intencionalmente guardam um registro de lápide no IndexedDB para impedir que clientes legados ressuscitem documentos excluídos.
- **Canal de Broadcast Multi-Aba**: Sincronização instantânea com zero latência entre múltiplas janelas ou abas no mesmo computador.

---

## 🚀 Parte 6: Service Worker e Caching Offline de Orçamentos e Catálogo [CONCLUÍDA ✅]

### Estratégia Multi-Camada de Cache Offline (`/public/sw.js`):
- **Estratégia Network-First para Navegação**: Garante carregamento instantâneo do App Shell (`index.html`) mesmo sem conexão à internet na usina ou no canteiro de obras.
- **Cache-First para Fontes e Ícones**: Cache persistente de `Inter` e `Material Symbols` para manter renderização nítida de botões de ação e ícones de cotação.
- **Stale-While-Revalidate para Recursos Estáticos**: Atualização em segundo plano dos bundles JS/CSS com disponibilidade imediata a partir do cache local.
- **Persistência de Catálogo e Propostas**: Histórico completo de cotações anteriores, cálculos volumétricos e tabela de preços de serviços/produtos sempre consultáveis e calculáveis offline.

