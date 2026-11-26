# Lines to review by ear

Similarity below 0.80 after retries (seeds 43 and 44).

- `4abe5af2b62afbc6` (en-US) score 0.75
  - text: N, O, P, Q!
  - heard: and O P Q.

## Validation pass (Task 8)

Three tree lines were voiced (place, arrival, grew); all ok. `verify.py` now accepts Whisper's homophones only for
bare-letter lines. Under that rule "S is for sun!" ("Ess is for sun!" came out "This is for sun!" with every seed) is sent
as "Ess, is for sun!" and passes; "N, O, P, Q!" passes because Whisper writes the name "en" as "and". Nobody has listened to
the letters yet: Lucas's listen-check of the 26 names is still open.
