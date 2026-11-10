# Lingoo: guia de estilo da arte

Este guia vale para o gatinho e para todos os animais. A referência aprovada pelo Lucas está em `amostras-aprovadas/` (o gatinho em 3 poses e o urso). A folha com tudo o que já está desenhado fica em `folha-de-personagens.png`, gerada pelos componentes reais:

```sh
npx tsx tools/visual/art-sheet.tsx
node tools/visual/shots.cjs tools/visual/.out/art-sheet.html docs/arte/folha-de-personagens.png
```

## 1. O estilo em uma frase

Vetor chapado e arredondado: formas simples sobrepostas, **sem contorno**, olhos grandes de tinta com pontos de brilho brancos, bochechas rosadas suaves e uma sombra macia no chão.

## 2. Onde cada desenho mora (código)

| Peça | Arquivo | Espaço de desenho |
|---|---|---|
| Gatinho | `src/art/Cat.tsx` | coordenadas da amostra aprovada (corpo em x 0–210). `viewBox="-4 -22 218 256"`, com folga em cima para o pulo do `happy` e a orelha do `listening`. |
| Animais | `src/art/animals/*.tsx` | cada um desenha um `<g>` num espaço **200 × 210**, centrado em x = 100, com o chão (sombra) em **y = 200**, igual ao urso aprovado. |
| Moldura | `src/art/Animal.tsx` | `viewBox="-20 -12 240 240"` (quadrado), com margem para o halo do `glow`. Põe `role="img"`, `aria-label` com a palavra em inglês, `lang="en"`, `data-art` e `data-glow`. |
| Peças comuns | `src/art/shared.tsx` | cores, `Eyes`, `Cheeks`, `GroundShadow`, `Sparkle`. |
| Animações | `src/art/art.css` | importado por `globals.css`. |

Os componentes não usam hooks (servem para Server Components) e não usam gradientes nem `clipPath`, então não precisam de ids. **Nunca** coloque `<text>`, letras ou números dentro do desenho: o cartão não pode entregar a resposta (há teste para isso).

## 3. Proporções

- **Cabeça grande:** cerca de **55% da altura** do personagem. O gatinho tem 53% (cabeça de 116 em 218). Nos animais em que orelhas ou olhos saem da cabeça, ela chega a 60–65%: urso (aprovado), sapo e ratinho. Passarinho e aranha são uma bola só, com cabeça e corpo juntos.
- **Corpo pequeno e redondo** embaixo da cabeça, um pouco mais escuro que ela (urso: cabeça `#B47A4C`, corpo `#A06A42`). Barriga ou focinho num tom claro.
- **Olhos** na metade de cima da cabeça, afastados, olhando para a criança. Raio entre 8 (urso aprovado) e 17 (aranha). Quanto mais "estranho" o bicho, maiores os olhos.
- **Pés** encostados na linha do chão (y ≈ 200) e **sombra no chão**: elipse `rgba(43,45,66,.12)`, com `ry` de 7 a 8 e a largura do personagem.
- **Nada encosta na borda do `viewBox`.** O personagem ocupa a mesma área que o urso (cerca de x 24–176, y 24–207). Se um bicho parecer menor no cartão, aumente-o (a aranha usa `scale(1.1)` a partir do chão).

## 4. Traço e sombras

- **Sem contorno.** Os volumes vêm de formas sobrepostas e de degraus de tom (escuro atrás, claro na frente).
- **Linhas só para detalhes:** boca, bigodes, olhos fechados, patas de passarinho e de aranha. Sempre com `stroke-linecap="round"`, na tinta `#2B2D42` ou num tom escuro do próprio bicho (bigode do gatinho `#EE8226`, do ratinho `#7D8391`). Espessura de 3 a 6. Braços e corpo de cobra são traços grossos e redondos da cor do pelo (de 18 a 32).
- **Sombra de forma:** preto a **6%** (`fill="#000" opacity=".06"`) por cima da cor base, como nas árvores e nas paradas do mapa. Os personagens quase não precisam dela, porque o degrau de tom já resolve.
- **Brilho:** branco (`#fff`), sem gradiente. No nariz do urso e do ratinho fica a 70%.

## 5. Rosto

- **Olhos:** círculo (ou elipse, no gatinho) de tinta `#2B2D42`, com um brilho branco grande no alto à direita (38% do raio) e um pequeno embaixo à esquerda (17%). Use `Eyes` de `shared.tsx`. O urso aprovado tem só o brilho grande.
- **Bochechas:** elipses de 10–12 × 6–8 ao lado do focinho.
  - Em pelo quente (laranja, marrom), coral `#FF7A6B` a 30–35%, como aprovado.
  - Em pelo frio (azul, verde, roxo, cinza), o coral fica barrento. Aí usamos rosa `#FF8FA3` a 75% (`<Cheeks cool />`).
- **Boca:** sorriso em "w" (gatinho, urso, ratinho), sorriso largo (sapo, cobra) ou boca aberta `#B23A48` com língua `#FF8FA3` (gatinho feliz, aranha). Sempre amigável: **sem dentes pontudos, sem presas, sem sobrancelha brava**.

## 6. Paleta por personagem

| Personagem | Base | Escuro | Claro | Detalhes |
|---|---|---|---|---|
| Gatinho | `#FF9F43` | `#EE8226` (listras, bigodes, ponta do rabo) | `#FFF1DE` (focinho, barriga, patas) | orelha e nariz `#FF8FA3` |
| Urso (bear) | `#B47A4C` (cabeça) | `#A06A42` (corpo, orelhas) | `#E9C49B` / `#F1D5B2` (focinho) | nariz e boca `#3A2A22` |
| Passarinho (bird) | `#4AA8F0` (azul-céu) | `#2F8FDB` (asas, topete) | `#D3ECFF` (barriga) | bico `#FFC93C` / `#F2A71B`, pés `#F2A71B` |
| Sapo (frog) | `#5CC46B` (verde-folha) | `#43AD57` (pernas, pés) | `#E4F6CF` (barriga) | narinas de tinta a 55% |
| Cobra (snake) | `#3DB57F` (verde-jade, diferente do sapo) | — | — | pintas `#FFC93C`, língua `#FF8FA3` |
| Aranha (spider) | `#9467D8` (roxo) | `#7648C4` (8 pernas) | `#C9B0F2` (barriga) | pontas das patas `#D9C6F7` |
| Ratinho (mouse) | `#AEB3BF` (cabeça) | `#9AA0AD` (corpo, orelhas) | `#E8EAEF` (focinho, barriga) | orelhas, pés e rabo `#FFA3B5`, nariz `#FF7A93` |

Cores comuns: tinta `#2B2D42`, sol `#FFC93C` (brilhos, halo do `glow`), céu `#4AA8F0`, folha `#5CC46B`, coral `#FF7A6B`, creme `#FFF8EC` (fundo).

## 7. Expressões do gatinho

| `expression` | Quando | Desenho |
|---|---|---|
| `idle` | esperando | como `pointing`, mas com os dois braços abaixados e olhando para a frente. O rabo balança. |
| `talking` | narração | igual ao `idle`, com a boca meio aberta, que abre e fecha. |
| `happy` | acertou | olhos fechados sorrindo, boca aberta e braços para cima (aprovado). Pula. |
| `pointing` | "Qual é o *bear*?" | olhos para a direita e braço apontando (aprovado). |
| `helping` | depois de um erro | cabeça inclinada, pata no rosto, sorriso suave e brilhos (aprovado). |
| `listening` | "Sua vez!" | orelha esquerda inclinada 20°, olhos para cima e ondas de som azuis perto da orelha. A orelha mexe de vez em quando. |

## 8. Animações (`art.css`)

- `.blink`: pisca a cada 4 s. Cada personagem pisca num momento diferente (`--blink-delay`), para os cartões não piscarem juntos.
- `idle`: o rabo balança. `happy`: pula, e a sombra diminui no ar. `talking`: a boca abre e fecha. `listening`: a orelha mexe.
- `glow`: o halo amarelo pulsa e os brilhos piscam. Sem animação, o halo continua visível.
- **Todas** param com `prefers-reduced-motion: reduce`, e o desenho parado continua completo.
- Só animamos `transform` e `opacity`, sempre num `<g>` sem atributo `transform` (o CSS substituiria o atributo).

## 9. Como adicionar um animal

1. Adicione o id em `artIdSchema` (`src/domain/trail/schema.ts`).
2. Crie `src/art/animals/<Nome>.tsx` com um componente que devolve um `<g>` no espaço 200 × 210:
   1. comece pela `GroundShadow` em y = 200;
   2. desenhe de trás para frente: rabo e pernas de trás, corpo, barriga, pés, orelhas, cabeça, rosto;
   3. use `Eyes` com `className="blink"` (já vem) e um `delay` próprio, e `Cheeks` (`cool` se o pelo for frio);
   4. cores como constantes no topo do arquivo, só chapadas.
3. Registre o componente em `DRAWINGS` e a palavra em inglês em `ART_WORDS` (`src/art/Animal.tsx`). O TypeScript avisa se faltar algum.
4. Dê o nome em português em `animalNames` (`tools/visual/art-sheet.tsx`).
5. Rode `npm test -- art`. O teste percorre todos os ids: rótulo em inglês, `lang="en"`, `glow` e nenhum `<text>`.
6. Gere a folha e **olhe o PNG**. Confira os pontos abaixo:
   - a criança reconhece o bicho de relance, inclusive no tamanho de cartão (120 px);
   - nada foi cortado;
   - a cara é amigável;
   - o desenho parece feito pela mesma mão que o urso.
7. Atualize a tabela de paleta acima.
