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
