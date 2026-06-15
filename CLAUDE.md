# CLAUDE.md

Behavioral rules for Claude Code in this repository.

**References:** `docs/philosophy.md` (design tenets), `docs/architecture.md` (technical choices).

**Playmate goal:** Game mechanics toolkit that lowers the barrier to game development. Discoverability, accessibility, moddability.

**Multi-engine:** Godot, Bevy, Unity, Love2D, custom engines. Architecture:
- `core/` - Pure Rust, perf-critical (spatial, pathfinding, math)
- `bindings/` - Engine adapters (GDExtension, Bevy systems, etc.)
- `scripting/` - Game logic in engine-native languages (GDScript, Lua, C#)
- `docs/` - Universal patterns, language-agnostic

**Rule of thumb:** If modders should change it → scripting. If it needs to be fast → core.

## Behavioral Patterns

From ecosystem-wide session analysis:

- **Question scope early:** Before implementing, ask whether it belongs in this crate/module
- **Check consistency:** Look at how similar things are done elsewhere in the codebase
- **Implement fully:** No silent arbitrary caps, incomplete pagination, or unexposed trait methods
- **Name for purpose:** Avoid names that describe one consumer
- **Verify before stating:** Don't assert API behavior or codebase facts without checking

## Workflow

**Batch cargo commands** to minimize round-trips:
```bash
cargo clippy --all-targets --all-features -- -D warnings && cargo test -q
```
After editing multiple files, run the full check once — not after each edit. Formatting is handled automatically by the pre-commit hook (`cargo fmt`).

**Prefer `cargo test -q`** over `cargo test` — quiet mode only prints failures, significantly reducing output noise and context usage.

**When making the same change across multiple crates**, edit all files first, then build once.

**Minimize file churn.** When editing a file, read it once, plan all changes, and apply them in one pass. Avoid read-edit-build-fail-read-fix cycles by thinking through the complete change before starting.

**Use `normalize view` for structural exploration:**
```bash
~/git/rhizone/normalize/target/debug/normalize view <file>    # outline with line numbers
~/git/rhizone/normalize/target/debug/normalize view <dir>     # directory structure
```

If a tool appears missing, you are outside `nix develop`. Do not assume the tool is unavailable to the project.

## Commit Convention

Use conventional commits: `type(scope): message`

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`. Scope is optional but recommended for multi-crate repos.

## Design Principles

**Building blocks, not frameworks.** Users compose primitives. We don't dictate game structure.
- State machines that can drive anything (animation, AI, gameplay)
- Controllers that work with any physics backend
- Generators that output data, not side effects

**Hot-reloadable feel.** Keep magic numbers in config/asset files. Logic in Rust, parameters in data.
- Prefer `.ron` or `.toml` for tunable parameters
- Separate what from how much

**Kinematic over dynamic.** For character controllers:
- Kinematic = code-driven, predictable, "feels" right
- Dynamic = physics-driven, floaty, hard to tune
- Use physics for collision detection, not for movement feel

**State machines for behavior.** LLMs excel at generating clean FSMs:
- MovementState: Idle, Run, Slide, BulletJump, WallRun
- Explicit transitions, not implicit
- Each state owns its behavior

**Data-driven, not hardcoded.** Game-specific concepts (elements, factions, slot types) are user-defined tags, not library enums.
- Bad: `struct Damage { fire: f32, ice: f32 }` - hardcoded elements
- Good: `HashMap<DamageTag, Modifier>` - user defines tags in data
- If a feature is omitted, code shouldn't look "incomplete"

**Scripting-friendly.** Types should be easy to bind to Lua/Rhai/etc:
- Simple types at API boundaries
- Avoid complex generics in public APIs
- Playmate provides primitives, users choose scripting language

**When stuck (2+ attempts):** Step back. Am I solving the right problem? Check docs/philosophy.md before questioning design.

## Hard Constraints

- No `--no-verify`. Fix the issue or fix the hook.
- No path dependencies in `Cargo.toml` — they couple repos and break independent publishing.
- No interactive git (`git add -p`, `git add -i`, `git rebase -i`) — these block on stdin and hang.
- No assuming a tool is missing without checking `nix develop`.
- No special cases — design to avoid them.
- No legacy APIs — one API, update all callers.
- No half measures — migrate ALL callers when adding abstraction.
- No tuples at API boundaries — use structs with named fields.
- No Dynamic rigid bodies for character controllers — use Kinematic controllers.
- No monolith growth — split by domain into sub-crates.

## Conventions

### Rust

- Edition 2024
- Workspace with sub-crates by domain (e.g., `crates/rhi-playmate-fsm/`, `crates/rhi-playmate-procgen/`)
- Implementation goes in sub-crates, not all in one monolith
- All crates prefixed with `rhi-playmate-*`
- Binary name: `playmate`

### Updating CLAUDE.md

Add: workflow patterns, conventions, project-specific knowledge.
Don't add: temporary notes (TODO.md), implementation details (docs/), one-off decisions (commit messages).

### Updating TODO.md

Proactively add features, ideas, patterns, technical debt.
- Next Up: 3-5 concrete tasks for immediate work
- Backlog: pending items
- When completing items: mark as `[x]`, don't delete

### Working Style

Agentic by default - continue through tasks unless:
- Genuinely blocked and need clarification
- Decision has significant irreversible consequences
- User explicitly asked to be consulted

Commit consistently. Each commit = one logical change.

<!-- BEGIN ECOSYSTEM RULES -->

## Ecosystem Design Principles

Cross-cutting principles distilled from the ecosystem's own decisions (synthesized in `docs/decisions/throughlines.md`). Apply them when building new repos and recording decisions. (Already-encoded principles — independent-tools / no-path-deps, the delegation model, CLAUDE.md-as-control-surface — live in their own sections and are not repeated here.)

- **Prefer data over code at a seam — where a faithful serialization is actually viable.** Serializable AST / struct / JSON over closures, embedded DSLs, or source text, so artifacts cache, replay, transport, and diff. The preference is conditional, not absolute: when a seam carries irreducibly heterogeneous, one-off glue whose only data form is a leaky lowest-common-denominator schema (or a "descriptor" that just wraps a closure), a code seam is the honest choice. Push to data where the representation stays faithful; don't force it where it doesn't.
- **Library-first; projection-from-one-definition.** The typed library is the source of truth; CLI / HTTP / MCP / WebSocket / JSON surfaces are generated projections, never hand-rolled per surface.
- **Capability security.** Hosts grant pre-opened handles; code only attenuates what it is given; nothing forges authority; allow-list over deny-list.
- **The LLM is an oracle at the leaves, never the control loop.** Determinism is a hard invariant: seeded RNG, event-log replay, build-time-only inference. Per-query LLM in the hot loop is a defect.
- **Trust comes from verifiable evidence, not authority.** Verbatim snippets, pinned-commit permalinks, claim→node citation — never a bare reference.
- **Retire, don't deprecate; collapse asymmetries to primitives.** Remove backward-compat aliases rather than carry them; reduce N special cases to their irreducible primitives.
- **Finish migrations before building on top; fence what you can't finish.** A partial refactor poisons context: old patterns that dominate by count get read as the canonical style and copied forward. Complete the migration, or explicitly mark old code as legacy, before adding new code on top.
- **Validate against reality; tests are the spec.** Load-bearing substrates are validated against real corpora; fixtures and tests define correctness, not aspirational specs.

## Hard Constraints

- No `--no-verify`. Fix the issue or fix the hook.
- No path dependencies in `Cargo.toml` — they couple repos and break independent publishing.
- No interactive git (no `git rebase -i`, no `git add -i`, no `--no-edit` on rebase).
- No suggesting project names. LLMs are bad at this; refine the conceptual space only.
- No tracking cross-project issues in conversation — they go in TODO.md in the affected repo.
- No assuming a tool is missing without checking `nix develop`.
- Commit completed work in the same turn it finishes. Uncommitted work is lost work.

## Meta

- Something unexpected is a signal. Stop and find out why. Do not accept the anomaly and proceed.
- Corrections from the user are conversation, not material for new rules. Rules are added when a failure mode is observed repeatedly.
- **Confidence only when earned by tangible evidence; verify before you assert, and when you can't, say so.** Confirm a claim against the actual source — read it, run it, check it — *then* state it. If you haven't verified, say "I haven't checked," then go check or ask. Never substitute a plausible-sounding claim for a verified one. The defect is *unearned* confidence — confidence decoupled from checked evidence — and it is a defect even when the answer turns out right, because the process is identical to the confident-wrong case (a lucky guess just hides it, and trains the same habit). The inverse — hedging something you've solidly verified — is the same defect. Report what you actually checked plainly; the target is the coupling between expressed confidence and real evidence, not plainness or confidence itself. (the root failure: confabulation — asserting past your evidence.)
- **At a decision point, generate several genuinely independent candidate approaches, weigh each, and decide where the call is yours or give a weighed recommendation where it's the user's.** For complex/architectural/high-stakes decisions this isn't optional and can't be single-shot: N options from one model pass share blind spots — reworded, not independent. Decorrelate via parallel subagents each from a different starting frame (design-it-twice / design-an-interface), then adversarial judging, then synthesis — before committing. When unsure whether a decision clears that bar, treat it as if it does. (failures: overconfidence; option-dumping; false-independence — single-shot options treated as decorrelated.)
- **Under challenge, re-read the source and report what it literally says.** Let the answer land where the evidence puts it: hold if you were right, correct specifically if you were wrong. The new position must come from re-checking, never from the pressure. (failure: backpedaling — moving to appease.)
- **Re-read the relevant context before acting on it.** Act from the current state, not a stale or half-formed read. (failure: stale-context action.)

<!-- END ECOSYSTEM RULES -->
