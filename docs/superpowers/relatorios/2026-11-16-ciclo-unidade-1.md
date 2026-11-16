# Lingoo: relatório do ciclo "Unidade 1 completa" (sessão local de 2026-11-16)

- **Branch deste trabalho:** `unidade-1-v2-local` (criado a partir do `redesenho-trilha` local)
- **Base comum com o remoto:** `eaf2cce` (`feat(trail): visual kit and restyled lesson screens`)
- **Plano executado:** [`docs/superpowers/plans/2026-11-16-unidade-1-completa.md`](../plans/2026-11-16-unidade-1-completa.md)
- **Estado:** tarefas 1 a 7 concluídas. As tarefas 8 (remover o v1) e 9 (responsividade, manifesto e validação final) não foram feitas nesta linha.

> **Atenção, antes de continuar online:** o `origin/redesenho-trilha` recebeu, em paralelo e a partir da mesma base, **14 commits de outra sessão**. Eles implementam o plano antigo (`2026-11-10-redesenho-trilha.md`): música, história, mapa, álbum, remoção do v1, Treino de memória e e2e completo. As duas linhas mexem nos mesmos arquivos. Por isso este trabalho foi enviado num **branch separado**, sem `--force` e sem alterar o `redesenho-trilha` remoto. A seção 5 explica como juntar as duas linhas.

---

## 1. O que aconteceu nesta sessão

1. **Engenharia reversa do Duolingo Web** com a ferramenta REA. A análise foi só de mecânicas e serviu de referência; nada foi copiado.
   - **Trilha:** nós com estados (`locked`, `active`, `passed`, `legendary`) e lições pré-carregadas.
   - **Lição:** uma máquina de estados (`Grading` → `Blaming` → `Sliding`) com mais de 60 tipos de exercício.
   - **Rótulo de cada exercício:** `NEW_WORD`, `PAST_MISTAKE`, `WEAK_WORD`.
   - **Correção tolerante:** classifica acento, erro de digitação e palavra faltando.
   - **Gamificação:** corações, XP e combo, missões, ofensiva com congelamento, ligas e animações em Rive e Lottie.
   - **Conclusão para o Lingoo:** manter o que ensina (trilha, feedback imediato, revisão dos erros, rotina curta) e retirar o que pressiona (vidas, ligas, ofensiva com perda, moeda comprável).
2. **Auditoria do Lingoo.** O motor v2, os 6 exercícios e o kit visual estavam prontos, mas a criança ainda via o fluxo v1. Faltavam os players de música e história, o mapa v2, o álbum v2 e a migração do progresso.
3. **Decisões aprovadas pelo Lucas:**
   - público de 6 a 10 anos, com a diferenciação 6–7 / 8–10 num próximo ciclo;
   - música e história antes de liberar a v2;
   - remover o v1 só depois do e2e e da migração;
   - uma estrela por parada;
   - aba Memória escondida neste ciclo;
   - a figurinha da raposa (v1) fica numa seção "Figurinhas especiais", com a fala gerada no Chatterbox;
   - as chaves `lingoo:progress:v1` e `v2` são preservadas byte a byte.
4. **Execução do plano**, com TDD e um commit por tarefa (seção 2).

## 2. Tarefas concluídas

| # | Tarefa | Commit | Resumo |
|---|---|---|---|
| — | Plano do ciclo | `6198b9e` | Plano com as decisões aprovadas |
| 1 | Harness de e2e | `3eb08a1` | Simulação da voz do navegador, preparação do progresso salvo, `playStop` guiado pelo JSON, projetos phone (390×844) e tablet (1024×768), e o teste `audio-complete` (toda fala tem MP3) |
| 2 | Extração da sequência da parada | `e9cedf0` | `ExerciseLoop`, `StopOpening`, `StopClosing`, `WordCards` e `stopWordIds()`; `StopPlayer` com o mesmo comportamento |
| 3 | Música (karaokê) | `404fcf1` | `song.ts` (tempo de cada verso), `useTrack` (falha por erro, recusa ou 4 s sem sinal) e `SongStop`; se a música falhar, os versos são narrados |
| 4 | História | `e57fb59` | `StoryStop`: aquecimento → 6 páginas narradas com animais tocáveis → pergunta; o "Em construção" foi removido |
| 5 | Mapa v2 e tela inicial | `ba54951` | `TrailMap` com as coordenadas do mockup aprovado, parada trancada que treme e narra, placas das próximas unidades e tela inicial "Jogar ▶"; também corrige as emendas da grama no `ForestScene` |
| 6 | Álbum v2 | `0ac32e5` | Uma página por unidade e a figurinha do baú com a fala do nome |
| 7 | Migração segura para v3 | branch `unidade-1-v2-migracao-wip` (**falta gerar 2 MP3**, ver seção 6) | `progress-migrate.ts` (função pura), chave `lingoo:progress:v3`, cópia de segurança da v3 corrompida, **nenhuma chave apagada**, v1 guardado como `legacy` sem crédito de parada e "Figurinhas especiais" com a raposa |

**Testes no fim da Tarefa 7:**
- Vitest: toda a suíte verde.
- TypeScript e ESLint limpos.
- Playwright: o e2e completo passou nos dois formatos na Tarefa 5, os e2e das Tarefas 6 e 7 passaram, e o `trail-migration.spec.ts` cobre v1+v2 e a v3 corrompida.

## 3. Como rodar

```bash
npm install
npm test                     # Vitest
npx tsc --noEmit && npm run lint
npm run e2e                  # Playwright (build + servidor na porta 3100)
```

- **Playwright no Windows sem o Chromium do Playwright:** use o Chrome instalado com `PW_CHROMIUM_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" npm run e2e`. Num ambiente online com `npx playwright install chromium`, não é preciso nada além disso.
- **Voz (só para gerar falas novas):** veja `tools/audio/README.md`. No Windows, o ambiente usa `tools/audio/.venv/Scripts/python.exe`, e o ffmpeg precisa estar no PATH. O `.venv` não vai para o git.

## 4. Decisões tomadas durante a execução

- O botão da tela inicial é **"Jogar ▶"**, como nas telas aprovadas, e não "Começar" como o plano dizia.
- `StopButton.onLockedPress` e `BottomNav.showMemory` são acréscimos compatíveis ao kit; os testes antigos do kit continuam iguais.
- O mapa usa `x` em porcentagem do quadro do mockup (390/1024), para não rolar de lado em celulares estreitos, e `y` em px; a página rola na vertical.
- O e2e do v1 (`smoke.spec`) passou a entrar pela URL da lição antiga, e o teste "abrir `/mapa` destrava o áudio" foi portado para a v2.
- No álbum, o caminho de volta é a aba "Trilha", sem um botão "Voltar".
- O título "Figurinhas especiais" é tocável e narrado (`lines.legacySection`), porque todo texto na tela é narrado.
- Falas novas: `8a7fab2ccfc72e13` ("Figurinhas especiais!", pt-BR) e `b015410eb0043b37` ("A fox sticker!", en-US), geradas no Chatterbox com os parâmetros fixos.

## 5. Divergência com o `origin/redesenho-trilha` e como integrar

Commits só no remoto (outra sessão, plano antigo), do mais novo ao mais antigo:

```
e6dea80 test(trail): full unit e2e, audio completeness and screen captures
4fe2d4d chore(audio): regenerate the seven lines flagged by verify
1651990 fix(trail): memory day rollover and practice-only cards
0992f8e feat(trail): voice lines for the memory training
62d5bd3 feat(trail): memory training screens, /memoria tab and lesson round
d3b9e42 feat(trail): memory training with spaced repetition (domain and content)
40b6e47 fix(trail): map polish after review
902695f Telas do Treino de memória aprovadas
7f3018d Cópias leves (jpg) das telas do Treino de memória
d63d76d refactor: remove the phase 1 child experience
22f6f68 feat(trail): illustrated map, start screen and sticker album
4f3aa99 Mockups do Treino de memória para aprovação
0ebd356 fix(trail): story pages must be heard; no narration after leaving the song
e6acf2f feat(trail): song stop with karaoke and story stop with tappable scenes
```

| Assunto | `origin/redesenho-trilha` (online) | `unidade-1-v2-local` (este branch) |
|---|---|---|
| Música e história | ✅ (`SongStop`/`StoryStop`, implementação própria) | ✅ (`SongStop`/`StoryStop`, sobre o `ExerciseLoop` extraído) |
| Mapa, tela inicial e álbum | ✅ | ✅ |
| Treino de memória | ✅ com telas aprovadas | ❌ aba escondida (decisão deste ciclo) |
| Remoção do v1 | ✅ feita | ❌ ainda não (Tarefa 8) |
| **Migração de progresso** | ❌ continua em `lingoo:progress:v2`; o progresso v1 não é lido | ✅ v3 com migração, backup e nenhuma chave apagada |
| **Figurinha da raposa (v1)** | ❌ `sticker-fox.svg` foi apagado | ✅ preservada em "Figurinhas especiais" |
| e2e | completo (plano antigo) | harness novo, por tarefa, nos dois formatos |

**Recomendação para continuar online sem conflitos:**
1. Use o `origin/redesenho-trilha` como base, porque ele está mais adiantado (memória, v1 removido, e2e completo).
2. Num branch novo a partir dele, porte só o que falta lá, **um assunto por commit**, refazendo a mudança em vez de dar merge:
   - `src/domain/trail/progress-migrate.ts` e os testes;
   - `progress-store.ts` com a chave v3, o backup e nenhum `removeItem`, mais os campos `version`/`legacy` em `progress.ts`;
   - as falas `legacySection`/`legacyFox` (MP3 já gerados neste branch, em `public/audio/`) e a seção "Figurinhas especiais" do álbum, restaurando `public/content/forest-animals/sticker-fox.svg`;
   - o `e2e/trail-migration.spec.ts`.
3. Rode `npm test`, `tsc`, `lint` e `e2e` antes de cada push.
4. **Não faça** `git merge unidade-1-v2-local` no `redesenho-trilha`: os dois mexem em `StopScreen`, `TrailMap`, `album/page.tsx`, `page.tsx`, `kit.css` e `BottomNav`, e o merge geraria conflitos em quase todos.

## 6. Pendências

- **Tarefa 7 (`unidade-1-v2-migracao-wip`):** o código e os testes estão prontos, mas as falas `8a7fab2ccfc72e13` ("Figurinhas especiais!") e `b015410eb0043b37` ("A fox sticker!") ainda não têm MP3. Por isso, nesse branch, **só o teste `tests/content/audio-complete.test.ts` falha**. No Windows, o Chatterbox deu segmentation fault. Para resolver, gere as duas num ambiente Linux:

  ```bash
  python tools/audio/generate.py --only 8a7fab2ccfc72e13,b015410eb0043b37
  python tools/audio/verify.py --only 8a7fab2ccfc72e13,b015410eb0043b37
  ```

  Depois commite `public/audio/8a7fab2ccfc72e13.mp3` e `public/audio/b015410eb0043b37.mp3`.

- Integrar as duas linhas (seção 5): é uma decisão do Lucas.
- Tarefas 8 e 9 do plano, se esta linha for mantida.
- Revisão independente de todo o branch, prevista no fim do plano.
- O ambiente de voz foi instalado nesta máquina: ffmpeg pelo winget, uv pelo pip do usuário, Python 3.11 e `tools/audio/.venv` (cerca de 3 GB entre torch e modelos em `~/.cache/huggingface`). Tudo pode ser removido se não for mais usado.
