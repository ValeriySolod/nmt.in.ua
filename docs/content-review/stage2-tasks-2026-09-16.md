# Stage 2 task content — sourcing and verification (2026-09-16)

Scope: seed content for `scripts/sql/028_stage2_task_formats.sql` (5 new
interactive formats for task 6.9 Stage 2). This is a short sourcing note per
the task's content-audit requirement — not a general formula reference.

## Source

All items are **original, internally authored content** — no external
source was used. This matches the existing `quiz_tasks`/`nmt_quiz_tasks`
bank, which also carries no external citations (see
`docs/content-review/quiz-tasks-2026-09-05.md`). Topics were deliberately
kept inside the same curriculum scope already present in that bank (linear
equations, quadratic equations via factoring, percentages, basic
planimetry angle facts, coordinate-graph point membership) — nothing here
introduces a topic or notation outside what the existing bank already
covers, so no curriculum-scope check against an external syllabus was
needed beyond confirming this alignment.

## Verification method

Every numeric/algebraic fact was verified by direct computation while
writing the migration (shown inline in each item's `comments` field) —
this is the appropriate "primary source" for self-contained arithmetic and
algebra facts (there is no external authority to cite for "2·4-1=7";
verification is the computation itself, checked independently below).

### 1. Assemble-the-solution (order_tasks)
- `3x+5=20` → `x=5`. Check: `3·5+5=20`. ✓
- `2(x-3)=10` → `x=8`. Check: `2·(8-3)=10`. ✓
- `x²-5x+6=0` → `(x-2)(x-3)=0` → `x=2` or `x=3`. Check: `2²-5·2+6=0`, `3²-5·3+6=0`. ✓
- Variant `4x-7=9` → `x=4`. Check: `4·4-7=9`. ✓

### 2. Find-the-error (find_error_tasks)
- `5x-3=2x+9`: correct step is `5x-2x=9+3` → `3x=12` → `x=4`. Check: `5·4-3=17=2·4+9`. ✓ (shown wrong line drops the sign flip on `-3`)
- `(x+3)²`: correct expansion `x²+6x+9` (quadratic-of-sum formula, middle term `2·x·3=6x`). Shown wrong line omits the middle term.
- `100 → -20% → +20%`: correct final price `80+0.2·80=96`, NOT `100` — the common "percentages cancel" misconception is the deliberate error to catch.
- Variant `4x-5=x+10`: correct step `4x-x=10+5` → `3x=15` → `x=5`. Check: `4·5-5=15=5+10`. ✓

### 3. Interactive graph (graph_tasks / graph_task_points)
- `y=2x-1`: `(0,-1)` ✓, `(1,1)` ✓, `(2,2)` ✗ (`2·2-1=3`), `(-1,-3)` ✓, `(3,4)` ✗ (`2·3-1=5`).
- `y=x²`: `(1,1)` ✓, `(2,4)` ✓, `(-2,4)` ✓, `(3,8)` ✗ (`3²=9`), `(0,1)` ✗ (`0²=0`).
- Roots of `x²-5x+6=0` on a number line: roots are `2` and `3` (see item 1 above); marked points at `1,2,3,4,6` → correct set `{2,3}`.
- Variant `y=-x+2`: `(0,2)` ✓, `(1,1)` ✓, `(2,1)` ✗ (`-2+2=0`), `(-1,3)` ✓, `(3,0)` ✗ (`-3+2=-1`).

### 4. Matching (matching_tasks / matching_task_pairs)
- `x²-9=(x-3)(x+3)`; `x²+6x+9=(x+3)²`; `x²-4x+4=(x-2)²` — standard factoring identities, each expandable to confirm.
- Angle facts: triangle angle sum `180°`; quadrilateral angle sum `360°`; supplementary angle to `70°` is `180-70=110°`; vertical angles equal, so vertical to `50°` is `50°`.
- Percentage multipliers: `+25% → ×1.25`; `-25% → ×0.75`; `+50% → ×1.5`; `-10% → ×0.9` — direct definition of percentage change as a multiplier.
- Variant factoring: `x²-16=(x-4)(x+4)`; `x²+8x+16=(x+4)²`; `x²-10x+25=(x-5)²`.

### 5. Fill-in-the-blanks (blank_tasks / blank_task_blanks)
- `2x+6=14` → `2x=14-6=8` → `x=8/2=4`. Check: `2·4+6=14`. ✓
- `30% of 250 = 250·0.3 = 75`. ✓
- `x²-4x+3=0`: `D=(-4)²-4·1·3=16-12=4`, `√D=2`, roots `(4±2)/2` → `x1=3` (larger), `x2=1` (smaller). Check: `3²-4·3+3=0`, `1²-4·1+3=0`. ✓ (task text phrases larger/smaller root explicitly to avoid order ambiguity in independent per-blank checking)
- Variant `3x-4=11` → `3x=11+4=15` → `x=15/3=5`. Check: `3·5-4=11`. ✓

## Curriculum-scope check

All topics (linear equations, factoring quadratics, percentage change,
triangle/quadrilateral angle sums, vertical/supplementary angles, linear
and quadratic function graphs) are standard NMT/ЗНО mathematics scope
already represented in the existing `quiz_tasks` bank under themes
"Елементарні дії", "Елементарна планіметрія", and the quadratic-equations
theme referenced in `docs/mentor-tasks.md`. No domain restriction or
notation beyond what's already used elsewhere in this bank was introduced.

## Analogous hint examples (migration 029)

Migration `029_analogous_hint_examples.sql` adds nullable `hint_example` to
quiz_tasks and all five Stage 2 content tables. Apply after 026–028, once,
before deploying code that selects the column. No production DB was touched.
DDL is not repeatable (duplicate columns fail). Test on an isolated DB first.
Old quiz tasks retain NULL: their answer explanation remains gated until the
retry is consumed. No unverified examples are manufactured for legacy tasks.

The twenty original examples below use different input data from their tasks.
They are the third rung, independently available before the retry after rungs
1 and 2. `comments` remains the current task's post-answer explanation.
The migration also removes current-answer substitutions from rule hints in
find_error 1–4, graph 3, and blank 2–3.

| Format/id | Independent verification of example |
|---|---|
| order/1 | 2×9+7=25 |
| order/2 | 3×(9−2)=21 |
| order/3 | 6+7=13; 6×7=42 |
| order/4 | 5×9−2=43 |
| find_error/1 | 7×7−8=41=3×7+20 |
| find_error/2 | (z+5)(z+5)=z²+10z+25 |
| find_error/3 | 200×0.9×1.1=198; second increase is 18 |
| find_error/4 | 6×7−9=33=2×7+19 |
| graph/1 | 3×2+2=8, not 7 |
| graph/2 | (−3)²+2=11; 3²+2=11, not 10 |
| graph/3 | roots 6 and 7 have sum 13, product 42; at 5 value is 2 |
| graph/4 | −2×3+7=1, not 2 |
| matching/1 | expansion gives z²−49, z²+14z+49, z²−12z+36 |
| matching/2 | 35°+145°=180°; vertical angles both 65° |
| matching/3 | 200×1.12=224; 200×0.88=176 |
| matching/4 | expansion gives z²−64, z²+16z+64, z²−18z+81 |
| blank/1 | 5×9+9=54 |
| blank/2 | 400×12/100=48 |
| blank/3 | 169−168=1; (13±1)/2 gives 7,6 |
| blank/4 | 2×9−7=11 |

These checks establish elementary arithmetic and identities only; no external
source, independent teacher review, or official-program alignment audit was
performed in this pass. Focused hint tests cover sequential unlock, pre-retry
analogous examples, repeated reads, and gated legacy explanation fallback.
