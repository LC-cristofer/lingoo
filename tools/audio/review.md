# Lines to review by ear

Voice: ElevenLabs, voice "Lingoo" (`WkDEtY2mQ0GvZNaE8SQa`, model `eleven_v4`), approved by Lucas on 2026-11-17.
All 123 lines were regenerated with `generate_eleven.py --force` (seed 42) and checked with `verify.py`:
ok 116, retried 7 (4 fixed by seeds 43/44), flagged 3.

The 3 flagged lines are transcription spelling only, not a voice problem: Whisper writes the homophone
"Lissão" and digits for "Lição um/dois/três". They sound right.

| id | lang | text | heard |
| --- | --- | --- | --- |
| `67e1d58cbecff5d1` | pt-BR | Lição um. Vamos! | Lissão 1. Vamos! |
| `f7d2b12c4bfe82d2` | pt-BR | Lição dois. Vamos! | Lissão 2. Vamos! |
| `9d35cc417177df53` | pt-BR | Lição três. Vamos! | Lissão 3. Vamos! |

## Árvore das Letras (261 new lines, 2026-11-26)

ok 388, retried 6, flagged 6 over all 394 lines. English letters are sent to the voice as their names (`say_as`, see
README); the check accepts the letter, its name or a usual Whisper spelling, and was run on the transcripts only (nobody has
listened). The 3 Lição lines above plus 3 new pt-BR lines are flagged, all Whisper spelling and not a voice problem
(it writes digits for "um"/"dois" and joins "Toque no" as "Tóquino"):

| id | lang | text | heard |
| --- | --- | --- | --- |
| `0a65073b983daea5` | pt-BR | Toque no | Tóquino! |
| `4e97aaec6244a8fd` | pt-BR | Galho um: | Galho 1. |
| `ac2a1ec96a2f61c0` | pt-BR | Galho dois: | Galho 2 |

Short English words alone are the weak spot of the voice: "van!" comes out as "then" with every seed, so it is sent as
"van?" (`src/domain/letras/say-as.ts`); "jam!" and "sun?" needed seeds 52 and 50 (`gym`, `son` before).
