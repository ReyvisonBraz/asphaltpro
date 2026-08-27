# 📖 Guia de Uso do Componente Reutilizável `<Button />`

O componente `<Button />` (`/src/components/common/Button.tsx`) é o padrão oficial de botões do **Asphalt Pro**. Ele padroniza acessibilidade, variantes de cor, ícones, estados de *loading*, responsividade e comportamento de clique.

---

## 🚀 Importação

```tsx
import { Button } from '@/components/common/Button';
// ou
import { Button } from '../common/Button';
```

---

## 🎨 Variantes Visuais (`variant`)

| Variante | Cor / Estilo | Caso de Uso | Exemplo |
| :--- | :--- | :--- | :--- |
| `primary` *(default)* | Âmbar Asfalto (`#835400`) | Ações principais (Salvar, Novo Orçamento, Criar Lançamento) | `<Button variant="primary">Salvar</Button>` |
| `secondary` | Fundo branco com borda cinza | Ações secundárias, filtros, fechar gavetas | `<Button variant="secondary">Cancelar</Button>` |
| `dark` | Preto Asfalto (`#010102`) | Exportações A4, ações executivas | `<Button variant="dark" icon="visibility">Ver A4</Button>` |
| `success` | Verde Floresta (`#2F9E44`) | Faturamento, aprovação, recebimento | `<Button variant="success" icon="check">Aprovar</Button>` |
| `danger` | Vermelho Carmesim (`#E03131`) | Exclusões, cancelamentos irreversíveis | `<Button variant="danger" icon="delete">Excluir</Button>` |
| `warning` | Ouro Industrial (`#F2A93B`) | Ações de atenção, visualização rápida | `<Button variant="warning">Atenção</Button>` |
| `ghost` | Transparente com hover suave | Ícones de ação em tabelas, navegação leve | `<Button variant="ghost" icon="edit" />` |
| `outline` | Borda âmbar com fundo transparente | Ações com ênfase média | `<Button variant="outline">Ver Detalhes</Button>` |

---

## 📏 Tamanhos (`size`)

- `xs` (`padding: px-2.5 py-1.5`, texto `11px`): Ideal para linhas de tabelas densas.
- `sm` (`padding: px-3 py-1.5`, texto `12px`): Barras de filtros e ações em cartões.
- `md` *(default)* (`padding: px-4 py-2`, texto `12px`): Modais e barras superiores.
- `lg` (`padding: px-6 py-2.5`, texto `14px`): Botões de confirmação e ações de destaque.

---

## 💡 Exemplos Práticos de Código

### 1. Botão Principal com Ícone
```tsx
<Button
  variant="primary"
  icon="add_circle"
  onClick={() => setIsModalOpen(true)}
>
  Novo Orçamento
</Button>
```

### 2. Botão com Estado de Carregamento Assíncrono (*Loading State*)
```tsx
<Button
  type="submit"
  variant="primary"
  isLoading={isSaving}
  loadingText="Gravando no Caixa..."
  icon="save"
>
  Salvar Lançamento
</Button>
```

### 3. Botão de Faturamento / Ação Positiva
```tsx
<Button
  variant="success"
  icon="price_check"
  size="sm"
  onClick={() => handleFaturar(quote)}
>
  Faturar Proposta
</Button>
```

### 4. Botão de Exclusão com Confirmação
```tsx
<Button
  variant="danger"
  size="xs"
  icon="delete"
  onClick={() => handleDelete(id)}
>
  Excluir
</Button>
```

### 5. Botão de Largura Total (Full Width)
```tsx
<Button
  variant="warning"
  fullWidth
  icon="open_in_new"
  onClick={handleOpenPreview}
>
  Abrir Visualizador Completo A4
</Button>
```

### 6. Cores Customizadas
```tsx
<Button
  customBgColor="#1971C2"
  customTextColor="#FFFFFF"
  icon="sync"
  onClick={handleSync}
>
  Sincronizar Usina
</Button>
```

---

## 📋 Lista Completa de Propriedades (Props)

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: string;                     // Nome do ícone Material Symbols
  iconPosition?: 'left' | 'right';    // Posição do ícone
  isLoading?: boolean;               // Ativa o spinner e bloqueia cliques
  loadingText?: string;              // Mensagem durante o carregamento
  fullWidth?: boolean;               // Ocupa 100% da largura
  customBgColor?: string;            // Cor hexadecimal ou RGB de fundo
  customTextColor?: string;          // Cor hexadecimal ou RGB do texto
  children?: React.ReactNode;        // Conteúdo textual ou JSX
}
```
