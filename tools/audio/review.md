# Lines to review by ear

`verify.py` flags nothing now (ok 115, retried 0, flagged 0). Seven short lines failed at seeds 42, 43 and 44 and were
regenerated with other seeds (same voice settings). Whisper hears all of them correctly now, but the lines are very short,
so a listen by ear is still worth it. (`verify.py` deletes this file when it finds nothing to flag; this note was written by hand.)

| id | lang | text | seed kept | heard |
| --- | --- | --- | --- | --- |
| `24dfa0a5b598f4ba` | pt-BR | Essa é a aranha. Em inglês: | 47 | Essa é a aranha. Em inglês? |
| `36ceba2ee2920f2f` | en-US | spider? | 48 | Spider? |
| `609717b4550f4fa1` | en-US | snake. | 46 | Snake? |
| `869a7a708aecfe97` | pt-BR | Toque nele! | 48 | Toque nele! |
| `877452f6431192be` | en-US | bird. | 48 | bird |
| `d40bf44a51bcc56c` | en-US | Hello! | 46 | Hello? |
| `e5c40c3ad07cc81c` | en-US | mouse. | 48 | mouse |

Phase 1 sticker lines (progress v3 migration), checked with `verify.py --only 8a7fab2ccfc72e13,b015410eb0043b37`:

| id | lang | text | seed kept | heard |
| --- | --- | --- | --- | --- |
| `8a7fab2ccfc72e13` | pt-BR | Figurinhas especiais! | 42 | Figurinhas especiais! |
| `b015410eb0043b37` | en-US | A fox sticker! | 44 | a Fox sticker. |

Map bubble lines ("Lição N. Vamos!" and friends), checked with `verify.py --only` plus a numeral-aware re-check
(Whisper writes "Lição 3" with a digit, which `verify.py` scores as a mismatch for "três"). `verify.py` also deletes this
file when nothing is flagged; it was restored from git and this table appended by hand. Short lines, so a listen by ear
is still worth it.

| id | lang | text | seed kept | heard |
| --- | --- | --- | --- | --- |
| `522fba53b560f569` | pt-BR | História. Vamos! | 42 | História. Vamos! |
| `83dcf8b19fc4a335` | pt-BR | Música. Vamos! | 42 | Música. Vamos! |
| `9223c4a674db5240` | pt-BR | Desafio. Vamos! | 42 | Desafio. Vamos! |
| `67e1d58cbecff5d1` | pt-BR | Lição um. Vamos! | 53 | Lissão 1, vamos! (the model says "li-SÃO", Whisper spells it phonetically) |
| `f7d2b12c4bfe82d2` | pt-BR | Lição dois. Vamos! | 47 | Lição 2. Vamos! |
| `9d35cc417177df53` | pt-BR | Lição três. Vamos! | 42 or 43 (best take kept by `verify.py`) | Lição 3, vamos! |
