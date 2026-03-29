# Prompt — Design System do Simples Manutenção

Use este documento como referência completa para replicar o visual, padrões e comportamentos do sistema "Simples Manutenção" em outro projeto.

---

## 1. Stack Técnica

- **Framework:** React 18 + TypeScript + Vite
- **Estilização:** CSS Modules (`.module.css` por componente, sem Tailwind, sem CSS-in-JS)
- **Ícones:** `lucide-react` (traço fino, consistente, ~20px no geral)
- **Fontes:** System fonts stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Roteamento:** React Router v7 com lazy loading (`React.lazy` + `Suspense`)
- **Estado:** `useState` / `useCallback` / `useMemo` + `localStorage` (sem Redux, sem Zustand)
- **Mobile:** Capacitor (Android/iOS)

---

## 2. Paleta de Cores

### Cores Primárias
| Token              | Valor       | Uso                                    |
|--------------------|-------------|----------------------------------------|
| `--cor-primaria`   | `#FFD600`   | Amarelo forte — acento principal       |
| `--cor-primaria2`  | `#FF8F00`   | Laranja — segundo tom do gradiente     |
| `--m-preto`        | `#0D0D0D`   | Preto quase puro — textos e destaques  |
| `--m-preto2`       | `#1A1A1A`   | Preto alternativo para fundos          |

### Gradiente Principal
```css
--m-gradiente: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%);
```
Usado em: headers, botões primários, tiles, abas ativas, hero, navbar.

### Gradiente Reverso
```css
--m-gradiente-r: linear-gradient(135deg, #FF8F00 0%, #FFD600 100%);
```

### Neutros
| Token                    | Valor       | Uso                                |
|--------------------------|-------------|-------------------------------------|
| `--cor-fundo`            | `#f4f4f5`   | Fundo geral das páginas (zinc-100)  |
| `--cor-superficie`       | `#ffffff`   | Fundo de cards e modais             |
| `--cor-borda`            | `#e4e4e7`   | Bordas padrão (zinc-200)            |
| `--cor-texto`            | `#18181b`   | Texto principal (zinc-900)          |
| `--cor-texto-secundario` | `#71717a`   | Texto secundário / labels (zinc-500)|

### Sombras
```css
--m-sombra-ouro:  0 4px 20px rgba(255, 183, 0, 0.35);
--m-sombra-ouro2: 0 8px 32px rgba(255, 143, 0, 0.45);
```

### Cores Semânticas
| Status / Ação    | Cor           | Background leve     |
|------------------|---------------|----------------------|
| Sucesso / Verde  | `#2e7d32`     | `#e8f5e9` / `#dcfce7` |
| Perigo / Vermelho| `#dc2626`     | `#fee2e2` / `#fef2f2` |
| Alerta / Âmbar   | `#e65100`     | `#fff3e0` / `#fef3c7` |
| Info / Azul      | `#1d4ed8`     | `#dbeafe`            |
| Roxo (editor)    | `#7c3aed`     | gradiente para `#a855f7` |

---

## 3. Tipografia

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```
Monospace (protocolos, timers): `'Courier New', monospace`

### Escala Tipográfica

| Elemento               | Tamanho    | Peso  | Observação                           |
|------------------------|-----------|-------|--------------------------------------|
| `h1` de página         | 26–28px   | 900   | `letter-spacing: -0.5px`            |
| Hero title (landing)   | `clamp(28px, 5vw, 48px)` | 900 | `line-height: 1.15`         |
| Título de seção        | 18–22px   | 800–900 | Com ícone à esquerda               |
| Card título            | 16–18px   | 800–900 |                                      |
| Label de campo         | 12–14px   | 800   | `text-transform: uppercase; letter-spacing: 0.5px` |
| Texto de corpo         | 14–15px   | 500–600 | `line-height: 1.6`                 |
| Texto secundário       | 13px      | 500–600 | cor `#71717a`                       |
| Badge / tag            | 11–12px   | 700–800 |                                      |
| Rodapé / micro texto   | 10–11px   | 600–700 |                                      |
| Subtítulo de header    | 13px      | 600   | cor `rgba(13,13,13,0.65)`           |

### Peso (font-weight)
- **900** → títulos principais, botões primários, nomes de card
- **800** → botões secundários, labels, badges, tabs
- **700** → nav links, filtros, textos de ênfase
- **600** → corpo, subtítulos
- **500** → texto secundário leve

---

## 4. Espaçamentos (Spacing)

### Padding de Página
```css
max-width: 960px;
margin: 0 auto;
padding: 0 0 60px;
```

### Gaps Padrão
| Contexto            | Gap       |
|---------------------|-----------|
| Entre seções        | 28–32px   |
| Grid de cards       | 20px      |
| Dentro de cards     | 10–16px   |
| Campos de form      | 14–20px   |
| Botões lado a lado  | 8–10px    |
| Itens em lista      | 10–14px   |
| Ícone + texto       | 6–10px    |

### Grid System
```css
/* Cards / tiles */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); /* tiles */
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* cards maiores */
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* feature cards */
gap: 20px;
```

---

## 5. Componentes

### 5.1 Navbar (Barra de Navegação)

**Desktop** — Barra superior fixa (sticky)
```css
background: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%);
height: 54px;
box-shadow: 0 2px 12px rgba(255,143,0,0.3);
position: sticky; top: 0; z-index: 100;
```

**Botão de Nav:**
```css
padding: 8px 14px;
background: rgba(0,0,0,0.12);
color: #0D0D0D;
border-radius: 10px;
font-size: 13px; font-weight: 800;
```

**Botão Ativo:**
```css
background: #0D0D0D;
color: #FFD600;
```

**Mobile** — Barra inferior fixa (breakpoint: 620px)
```css
height: 62px;
position: fixed; bottom: 0;
background: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%);
box-shadow: 0 -2px 16px rgba(255,143,0,0.35);
z-index: 200;
```
- Botões em coluna: ícone 22px + label 10px (font-weight: 800)
- Ativo: indicador `::after` com barra preta de 3px no bottom

### 5.2 Header de Página (dentro da tela logada)

Todas as páginas internas usam o mesmo padrão:
```css
background: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%);
border-radius: 20px;
padding: 24px 24px 20px;
box-shadow: 0 8px 32px rgba(255,143,0,0.35);
position: relative; overflow: hidden;
```

**Decoração circular sutil** (pseudo-elemento):
```css
.header::before {
  content: '';
  position: absolute;
  top: -30px; right: -30px;
  width: 120px; height: 120px;
  background: rgba(255,255,255,0.12);
  border-radius: 50%;
}
```

**Estrutura:** flex, justify-content: space-between
- Esquerda: ícone decorativo (emoji 44px) + título (26px/900) + subtítulo (13px/600)
- Direita: badges de resumo e/ou botões de ação

### 5.3 Cards

**Card padrão:**
```css
background: #fff; /* var(--cor-superficie) */
border: 1px solid #e4e4e7; /* var(--cor-borda) */
border-radius: 16px;
overflow: hidden;
transition: box-shadow 0.2s, transform 0.15s;
```
**Hover:**
```css
box-shadow: 0 6px 20px rgba(0,0,0,0.1);
transform: translateY(-1px);
```

**Card com faixa lateral colorida (chamados/checklist):**
```css
border-left: 6px solid [cor-da-função];
```

**Card de QR Code:**
```css
border: 2px solid #f0f0f0;
border-radius: 20px;
/* hover: */
border-color: #FFD600;
box-shadow: 0 8px 32px rgba(255,214,0,0.15);
```

### 5.4 Tiles (Botões grandes / funções)

```css
padding: 32px 16px 24px;
border-radius: 20px;
background: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%);
color: #0D0D0D;
box-shadow: 0 4px 20px rgba(255,183,0,0.35);
height: 190px;
```
- Ícone: emoji 52px com `drop-shadow(0 3px 6px rgba(0,0,0,0.2))`
- Nome: 16px / 900
- Decoração: círculo branco translúcido no canto `rgba(255,255,255,0.15)` (80px)
- Hover: `translateY(-4px)` e sombra maior
- Active: `scale(0.97)`

**Tiles de cor fixa (funções embutidas):**
Alguns tiles usam background fixo em vez do gradiente dourado:
| Tile             | Background                                             | Cor texto  |
|------------------|--------------------------------------------------------|------------|
| Manutenção Livre | `linear-gradient(135deg, #1A1A1A 0%, #333 100%)`      | `#FFD600`  |
| Checklist        | `linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)`   | `#fff`     |
| Funcionários     | `linear-gradient(135deg, #2E7D32 0%, #43A047 100%)`   | `#fff`     |
| QR Codes         | `linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%)`   | `#fff`     |
| Documentos       | `linear-gradient(135deg, #E65100 0%, #F57C00 100%)`   | `#fff`     |

Estes tiles usam a classe `.tileCustom` com `--tile-bg` CSS variable.

**Botões dentro dos tiles (Editar / Ver / Excluir):**
```css
font-size: 11px; font-weight: 800;
padding: 6px 14px;
border-radius: 20px;
background: rgba(0,0,0,0.15);
min-width: 100px;
justify-content: center;
text-transform: uppercase;
letter-spacing: 0.8px;
```
Ícones lucide dentro: `size={11}`

### 5.5 Botões

**Primário (gradiente):**
```css
padding: 14px 28px;
background: linear-gradient(135deg, #FFD600, #FF8F00);
color: #0D0D0D;
border: none;
border-radius: 12px;
font-size: 14–16px; font-weight: 800–900;
box-shadow: 0 4px 14px rgba(255,183,0,0.35);
```
Hover: `translateY(-2px)` + sombra maior

**CTA Primário (invertido, dark):**
```css
padding: 14px 28px;
background: #0D0D0D;
color: #FFD600;
border-radius: 14px;
font-size: 16px; font-weight: 800;
box-shadow: 0 6px 24px rgba(0,0,0,0.3);
```

**Secundário (outline):**
```css
padding: 9px 18px;
background: transparent;
color: #52525b;
border: 1.5px solid #e4e4e7;
border-radius: 12px;
font-size: 14px; font-weight: 600;
```
Hover: `background: #f4f4f5; border-color: #d4d4d8;`

**Botão de ação (azul):**
```css
padding: 8px 16px;
background: #1d4ed8;
color: #fff;
border-radius: 20px;
font-size: 13px; font-weight: 800;
```

**Botão de perigo (vermelho):**
```css
padding: 8px 16px;
background: #dc2626;
color: #fff;
border-radius: 20px;
font-size: 13px; font-weight: 800;
```

**Botão de sucesso (verde):**
```css
padding: 9px 14px;
background: #2e7d32;
color: white;
border-radius: 10px;
font-size: 13px; font-weight: 800;
```

**Botão de excluir (ghost):**
```css
padding: 9px 12px;
border: 1px solid #e4e4e7;
border-radius: 10px;
background: transparent;
color: #9ca3af;
/* hover: */
background: #fee2e2;
border-color: #b91c1c;
color: #7f1d1d;
```

**Filtro / Tab:**
```css
padding: 8px 14px;
border: 2px solid var(--cor-borda);
border-radius: 20px; /* pill shape */
font-size: 13px; font-weight: 700;
```
Ativo:
```css
background: linear-gradient(135deg, #FFD600, #FF8F00);
border-color: transparent;
color: #0D0D0D;
box-shadow: 0 3px 10px rgba(255,183,0,0.35);
```

### 5.6 Inputs / Campos de Formulário

```css
padding: 14px 16px;
border: 2px solid #e4e4e7;
border-radius: 12–14px;
font-size: 15px;
color: var(--cor-texto);
background: var(--cor-superficie);
outline: none;
transition: border-color 0.2s, box-shadow 0.2s;
font-family: inherit;
```
**Focus:**
```css
border-color: #FF8F00;
box-shadow: 0 0 0 3px rgba(255,143,0,0.18–0.25);
```
**Erro:**
```css
border-color: #ef4444;
```

**Label de campo:**
```css
font-size: 12px;
font-weight: 800;
color: var(--cor-texto-secundario);
text-transform: uppercase;
letter-spacing: 0.5px;
```

### 5.7 Barra de Busca

```css
position: relative;
/* Ícone (Search): absolute, left: 16px, center vertical */
/* Input: padding-left ~50px */
border: 2px solid var(--cor-borda);
border-radius: 14px;
/* Focus: border-color: #FF8F00 com glow ring */
/* Botão limpar: à direita, circular, transparente */
```

### 5.8 Badges / Tags de Status

```css
font-size: 12px; font-weight: 800;
padding: 4–5px 12px;
border-radius: 20px; /* pill */
white-space: nowrap;
```

| Estado     | Background  | Cor texto  |
|------------|-------------|------------|
| Ativo      | `#dbeafe`   | `#1e40af`  |
| Concluído  | `#dcfce7`   | `#166534`  |
| Problema   | `#fef3c7`   | `#92400e`  |
| Urgente    | `#fee2e2`   | `#991b1b`  |

**Badge de contador (nav/tabs):**
```css
background: #0D0D0D;
color: #FFD600;
font-size: 10px; font-weight: 800;
padding: 2px 7px;
border-radius: 20px;
```

**Protocolo / ID:**
```css
font-size: 11px; font-weight: 800;
font-family: 'Courier New', monospace;
background: linear-gradient(135deg, rgba(255,214,0,0.2), rgba(255,143,0,0.2));
color: #7a3500;
padding: 3px 10px;
border-radius: 6px;
border: 1px solid rgba(255,143,0,0.3);
letter-spacing: 0.5px;
```

### 5.9 Modais / Overlays

**Overlay:**
```css
position: fixed; inset: 0;
background: rgba(0,0,0,0.65);
display: flex; align-items: center; justify-content: center;
z-index: 1000;
padding: 16px;
backdrop-filter: blur(4px);
```

**Modal container:**
```css
background: #fff;
border-radius: 24px;
width: 100%; max-width: 520–680px;
max-height: 92vh;
display: flex; flex-direction: column;
overflow: hidden;
box-shadow: 0 24px 80px rgba(0,0,0,0.4);
```

**Modal header (com gradiente):**
```css
background: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%);
padding: 20px 24px;
```

**Botão fechar (dentro de modal):**
```css
background: rgba(0,0,0,0.15); /* ou rgba(255,255,255,0.25) */
border: none;
border-radius: 50%;
width: 36px; height: 36px;
color: #0D0D0D;
cursor: pointer;
```

**Mobile bottom-sheet** (formulários):
```css
/* Abre de baixo, rounded top */
border-radius: 24px 24px 0 0;
align-items: flex-end; /* no overlay */
/* Desktop: */
@media (min-width: 640px) {
  border-radius: 24px;
  align-items: center;
}
```

### 5.10 Gráficos / Seção de Dados

```css
background: var(--cor-superficie);
border: 1px solid var(--cor-borda);
border-radius: 20px;
padding: 24px;
```

Grid interna:
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
gap: 20px;
```

### 5.11 Estado Vazio

```css
display: flex;
flex-direction: column;
align-items: center;
gap: 10–12px;
padding: 48–64px 20px;
text-align: center;
color: var(--cor-texto-secundario);
```
- Ícone emoji: 52–64px
- Título: 18–20px / 800
- Descrição: 14px / normal

### 5.12 Detalhes Expandidos (accordion)

```css
padding: 16px 20px;
background: var(--cor-fundo); /* #f4f4f5 */
border-top: 1px solid var(--cor-borda);
```
Grid interna:
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
gap: 10px;
```
Cada item:
```css
background: var(--cor-superficie);
padding: 10px 14px;
border-radius: 10px;
/* Label: 11px/800, uppercase | Valor: 14px/600 */
```

### 5.13 Wizard (step-by-step)

**Header:** gradiente `#FFD600 → #FF8F00`  
**Barra de progresso:** steps circulares (32px) com linha conectora
- Step inativo: `background: rgba(0,0,0,0.2)`
- Step ativo: `background: #0D0D0D; color: #FFD600`
- Step atual: `box-shadow: 0 0 0 4px rgba(0,0,0,0.2); transform: scale(1.15)`

**Pergunta da etapa:** 20px / 800  
**Hint:** 14px / regular, cor secundária

### 5.14 Resumo Cards (no header)

```css
display: flex; gap: 10px;
```
Cada card:
```css
padding: 10px 18px;
background: rgba(0,0,0,0.12);
border-radius: 12px;
min-width: 64px;
text-align: center;
```
- Número: 24px / 900 / cor `#0D0D0D`
- Label: 11px / 700 / cor `rgba(13,13,13,0.65)`

---

## 6. Padrões de Animação e Transição

### Transições Globais
```css
transition: all 0.2s;           /* padrão para botões e cards */
transition: all 0.15s;          /* interações rápidas */
transition: border-color 0.2s, box-shadow 0.2s;  /* inputs */
transition: width 0.4s ease;    /* barras de progresso */
```

### Hover
- **Cards:** `translateY(-1px)` a `translateY(-4px)` + aumento de sombra
- **Botões:** `translateY(-1px)` a `translateY(-3px)` + sombra mais forte
- **Tiles:** `translateY(-4px)` + sombra `--m-sombra-ouro2`
- **Active:** `scale(0.97)`

### Animações
```css
/* Loader spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
/* Botão de gravação (mic) */
@keyframes brilho {
  0%, 100% { box-shadow: 0 4px 18px rgba(220, 38, 38, 0.55); }
  50%       { box-shadow: 0 4px 28px rgba(220, 38, 38, 0.85); }
}
```

---

## 7. Responsividade

### Breakpoints
| Breakpoint  | Uso                                               |
|-------------|---------------------------------------------------|
| `620px`     | Navbar: desktop → mobile (bottom nav)              |
| `640px`     | Modais: bottom-sheet → centralizado                |
| `768px`     | Ajustes de grid e padding (landing)                |

### Padrão Mobile
- Grids colapsam para 1 coluna
- Cards ficam 100% width
- Navbar desktop some, bottom nav aparece (62px, fixed bottom)
- Bottom spacer (70px) para evitar sobreposição
- Headers ficam mais compactos
- Font sizes reduzem ~2px

---

## 8. Loader / Loading

```css
/* Spinner centralizado */
width: 40px; height: 40px;
border: 3px solid #eee;
border-top: 3px solid #FFD600;
border-radius: 50%;
animation: spin 0.8s linear infinite;
```

---

## 9. Landing Page — Seções

### Hero
- Fundo: gradiente principal `#FFD600 → #FF8F00`
- 3 decorações circulares translúcidas (`rgba(255,255,255,0.06–0.12)`)
- Badge: `rgba(0,0,0,0.12)` pill label
- CTA primário: fundo `#0D0D0D`, texto `#FFD600`
- CTA secundário: `rgba(255,255,255,0.25)` com borda branca translúcida
- Stats: números 26px/900 + labels 12px/600 uppercase

### Seções Claras
```css
padding: 80px 24px;
max-width: 1100px; margin: 0 auto;
```
- Label: pill `rgba(255,183,0,0.12)`, cor `#FF8F00`, 12px uppercase
- Título: `clamp(24px, 4vw, 36px)` / 900 / `#18181b`
- Subtítulo: 16px / `#71717a` / max-width 580px

### Seção Dark (Conheça)
```css
background: #0D0D0D;
```
- Cards: `background: #18181b; border: 1px solid #27272a; border-radius: 20px`
- Hover: `border-color: #FFD600; box-shadow: 0 12px 40px rgba(255,214,0,0.12)`
- Textos em branco; destaques em `#FFD600`

### Feature Cards
```css
background: #fff;
border-radius: 20px;
padding: 28px;
border: 1px solid #e4e4e7;
```
- Ícone: 56px container com `border-radius: 16px`
- Título: 18px/800
- Lista de features: check icon verde `#22c55e` + texto 13px

### Steps (Como Funciona)
```css
background: #f4f4f5;
border-radius: 20px;
padding: 24px;
```
- Número gigante: 40px/900, cor `#FFD600`, stroke `#FF8F00`
- Setas entre steps (ícone)

---

## 10. Padrão de WhatsApp Flutuante

```css
position: fixed;
bottom: 24px; right: 24px; /* mobile: ajustar para 80px bottom */
width: 56px; height: 56px;
background: #25D366;
border-radius: 50%;
box-shadow: 0 4px 20px rgba(37,211,102,0.5);
z-index: 999;
```

---

## 11. Login Page

- Fundo: gradiente principal full-page
- Card: `background: #fff; border-radius: 28px; padding: 40px 32px; max-width: 400px`
- Sombra: `0 24px 80px rgba(0,0,0,0.25)`
- Logo: `<img>` 108px height (arquivo `public/logos/logo.png`) — sem texto; só a imagem
- Inputs: `padding: 15px 18px; border: 2px solid #e4e4e7; border-radius: 14px; font-size: 15px`

---

## 12. Padrão de Protocolo / ID

Formato: `MNT-XXXXXX` (6 dígitos, zero-padded)  
Visual:
```css
font-family: 'Courier New', monospace;
background: linear-gradient(135deg, rgba(255,214,0,0.2), rgba(255,143,0,0.2));
color: #7a3500;
border: 1px solid rgba(255,143,0,0.3);
border-radius: 6px;
padding: 3px 10px;
font-size: 11px; font-weight: 800;
letter-spacing: 0.5px;
```

---

## 13. Timer / Tempo Real

```css
font-size: 22px; font-weight: 900;
font-family: 'Courier New', monospace;
font-variant-numeric: tabular-nums;
background: linear-gradient(135deg, #FFD600, #FF8F00);
color: #0D0D0D;
padding: 7px 16px;
border-radius: 10px;
box-shadow: 0 4px 20px rgba(255,183,0,0.35);
```

---

## 14. Princípios de Design

1. **Amarelo + Preto + Branco** — a paleta é essa e ponto. Gradiente dourado forte, textos em preto pesado, fundos brancos limpos.
2. **Peso 800-900** em tudo que é clicável ou título. O sistema é "bold first".
3. **Border-radius generoso** — 10px mínimo em botões, 16-20px em cards, 24px em modais, 20px em pills.
4. **Sombras quentes** — sempre com tom laranja/dourado (`rgba(255,183,0,...)`) ao invés de cinza.
5. **Decorações circulares translúcidas** — pseudo-elementos com `border-radius: 50%` e `rgba(255,255,255,0.08-0.15)` nos headers.
6. **Ícones emoji** — funções usam emojis como ícones principais (🔧, 📋, 🔍, etc.) — tamanho 44-52px com drop-shadow.
7. **Feedback de hover** — sempre `translateY` negativo + sombra incrementada.
8. **Focus state nos inputs** — ring glow laranja `box-shadow: 0 0 0 3px rgba(255,143,0,0.2)`.
9. **Gradiente como identidade** — o gradiente 135deg aparece em headers, botões, nav, tiles, badges ativos. É ubíquo.
10. **Mobile-first com bottom nav** — navegação inferior com ícones + labels minúsculos, indicador de aba ativa com barra preta.
11. **Navegação simplificada** — apenas 3 itens no nav: Dashboard (master only), Manutenção (todos), Chamados (todos). Funcionalidades extras (Checklist, Funcionários, QR Codes, Documentos) são acessadas via card tiles nas abas da página de Manutenção.
12. **Logo apenas imagem** — navbar mostra só o logotipo (`<img>` 28px), sem texto "S. Manutenção".

---

## 15. Resumo Rápido para Prompt de IA

```
Replique o design system "Simples Manutenção":
- Gradiente principal: linear-gradient(135deg, #FFD600, #FF8F00)
- Preto: #0D0D0D | Fundo: #f4f4f5 | Superficie: #fff | Borda: #e4e4e7
- Font: system stack (apple-system, Segoe UI, Roboto) | Mono: Courier New
- Pesos: 900 (títulos), 800 (botões/labels), 700 (nav), 600 (corpo)
- Border-radius: 10px (btns), 12-14px (inputs), 16px (cards), 20px (pills/tiles), 24px (modais)
- Sombras douradas: rgba(255,183,0,0.35) e rgba(255,143,0,0.45)
- Headers de página: gradiente, rounded 20px, sombra, decoração circular branca translúcida
- Botões primary: gradiente, 900, 12px radius, sombra ouro, hover translateY(-2px)
- Inputs: border 2px #e4e4e7, focus border #FF8F00 + ring glow laranja
- Cards: white, border 1px #e4e4e7, radius 16px, hover translateY(-1px) + sombra
- Modais: overlay blur(4px), card 24px radius, max-width 520-680px, sombra forte
- Mobile: bottom nav 62px, breakpoint 620px
- Ícones: lucide-react ~20px | Emojis como ícones de funções 44-52px
- CSS Modules (sem Tailwind)
- Nav: apenas 3 itens (Dashboard master, Manutenção, Chamados)
- Tiles fixos: Manutenção Livre (preto), Checklist (azul), Funcionários (verde), QR Codes (roxo), Documentos (laranja)
- Tile height fixo: 190px (não min-height)
- Logo: apenas imagem <img>, sem texto
- Login logo: 108px height
```
