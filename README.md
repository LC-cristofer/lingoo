# Lingoo

Aplicativo (PWA) para crianças de 5 a 8 anos aprenderem inglês brincando: um mapa de aventura com lições curtas, jogos, músicas e um álbum de figurinhas. Quase sem texto na tela, tudo com som e imagem.

## Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento em http://localhost:3000
npm test         # testes unitários (Vitest)
npm run e2e      # testes de ponta a ponta (Playwright)
```

## Como o app é organizado

- **Tela inicial** (`/`): o gatinho e o botão "Jogar".
- **Mapa** (`/mapa`): uma trilha vertical por mundo, com as paradas da unidade (música, três lições, história e desafio) e as próximas unidades bloqueadas.
- **Paradas** (`/parada/<unidade>/<parada>`): cada parada é uma sequência curta de exercícios narrados.
- **Álbum** (`/album`): as figurinhas ganhas nos desafios.
- **Treino de memória** (`/memoria`): a aba da barra inferior onde a criança revê as palavras já aprendidas, com cartões que voltam em dias diferentes.
- **Revisão** (`/revisao`): página só para adultos (equipe e revisores de conteúdo). Abre qualquer parada direto, sem salvar progresso. Nenhuma tela da criança aponta para ela.
- **Progresso**: fica no navegador, em `localStorage`, na chave `lingoo:progress:v3`. As chaves antigas (v1 e v2) são mantidas e migradas para a v3 sem apagar nada.
- O conteúdo fica em `content/` (`path.json`, `units/`, `lines.json`) e a arte em `src/art/`. A aparência aprovada está em `docs/arte/telas-aprovadas/`.
