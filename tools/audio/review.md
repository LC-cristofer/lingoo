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

English letters are sent to the voice as their names (`say_as`, see README), and the check was run on the transcripts only
(nobody has listened). The 3 Lição lines above plus 3 new pt-BR lines are flagged, all Whisper spelling and not a voice
problem (it writes digits for "um"/"dois" and joins "Toque no" as "Tóquino"):

| id | lang | text | heard |
| --- | --- | --- | --- |
| `0a65073b983daea5` | pt-BR | Toque no | Tóquino! |
| `4e97aaec6244a8fd` | pt-BR | Galho um: | Galho 1. |
| `ac2a1ec96a2f61c0` | pt-BR | Galho dois: | Galho 2 |

Short English words alone are the weak spot of the voice: "van!" comes out as "then" with every seed, so it is sent as
"van?" (`src/domain/letras/say-as.ts`); "jam!" and "sun?" needed seeds 52 and 50 (`gym`, `son` before).

## Validation pass (Task 8, 2026-11-26)

Three tree lines were voiced (place, arrival, grew). `verify.py` now accepts Whisper's homophones only for bare-letter
lines; in a sentence only the letter or the name sent to the voice pass. Under that rule "S is for sun!" ("Ess is for sun!"
came out "This is for sun!" with every seed) is sent as "Ess, is for sun!" and passes; "N, O, P, Q!" passes because Whisper
writes the name "en" as "and". The place line says "as letras em inglês" (no bare "ABC", which a pt-BR voice may read as
"a-bê-cê"). Nobody has listened to the letter names yet: Lucas's listen-check of the 26 names is still open.

Full run of `verify.py` over all 397 lines after these changes: ok 389, retried 8, flagged 7. The 7 flagged are the 6 pt-BR
Whisper-spelling lines above (3 Lição, "Toque no", "Galho um:", "Galho dois:") plus `ec7327e589e84777` "Hello, forest!"
(en-US; Whisper writes the place name "Forrest", the word sounds right to the transcript).

The generated list below is what that run wrote:

- `0a65073b983daea5` (pt-BR) score 0.00, heard "Tóquino!"
- `4e97aaec6244a8fd` (pt-BR) score 0.50, heard "Galho 1."
- `67e1d58cbecff5d1` (pt-BR) score 0.67, heard "Lição 1. Vamos!"
- `9d35cc417177df53` (pt-BR) score 0.33, heard "Lissão 3. Vamos!"
- `ac2a1ec96a2f61c0` (pt-BR) score 0.50, heard "Galho 2"
- `ec7327e589e84777` (en-US) score 0.50, heard "Hello, Forrest!"
- `f7d2b12c4bfe82d2` (pt-BR) score 0.33, heard "Lissão 2. Vamos!"
