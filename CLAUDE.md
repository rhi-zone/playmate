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

## Context Is The Only Scarce Resource

Every byte that enters the main session stays in the main session for its entire lifetime. File contents, command output, search results — once read, it lingers in cache and shapes every downstream token. There is no "just looking."

**All exploration runs in subagents.** Investigations, audits, deep dives, surveys, "let me check," "let me find" — if the purpose of a tool sequence is to find out something you don't yet know, it runs in a subagent. Renaming the activity does not change what it is. The subagent returns a distilled summary; the raw output stays in the subagent.

Inline tool use in the main context is reserved for: reading a known file at a known path, edits/writes you're committing to, a single targeted lookup whose result you'll act on immediately. If you find yourself running a second grep to refine the first, you should have spawned a subagent.

The main session holds only the durable artifacts you are producing: the edit, the commit, the doc update.

## Subagent Prompts

A subagent prompt is composed in a "spec-writing" register that subtly changes what feels in-scope. Specific failure modes to name:

**Never tell a subagent "do not commit."** Delegation does not strip the commit step from completed work. If a subagent modifies files and the work is done, either the subagent commits, or the next thing the delegator does after it returns is commit — not summarize, not report. The phrase "do not commit" in your own prompt is the tell that you are about to leave work uncommitted.

**Do not delegate judgment.** Phrases like "if extraction is awkward, just duplicate" or "based on your findings, fix the bug" push synthesis onto the agent. If you are punting a decision into the prompt, you do not yet have enough understanding to delegate. Investigate first; write the prompt with the decision already made.

**Do not ask for a diff summary.** Subagent self-reports describe intent, not effect. After a code-modifying subagent returns, read `git diff` yourself. Skip the "report what you changed" instruction — it produces text you cannot trust and that pollutes main context.

**Do not re-explain CLAUDE.md.** Subagents inherit it. Repeating project layout or repo conventions in the prompt dilutes the actual task instructions and signals half-trust in the inheritance. Trust it or don't read it.

**Line numbers are orientation, not anchors.** Files shift between your read and the subagent's read. When citing locations, tell the subagent to find the lines by content ("the block that does X"), not by number.

**Name files explicitly; do not outsource the grep.** "Wherever it appears" invites scope creep. Grep first, list the exact files in the prompt.

**If the task is smaller than the prompt describing it, do it inline.** A subagent dispatch pays a full system-prompt + CLAUDE.md cache cost. One-shot bash commands and single-line edits should run in the main session with `Bash` or `Edit`.

**Match agent type to deliverable shape.** `Explore` is for lookup and search — finding files, symbols, references — not analytical synthesis. For audits, surveys, and pattern analysis whose deliverable is a report, use `general-purpose` with an explicit Opus model. For tasks whose deliverable is files on disk, use `general-purpose` with the tier matched to the work (Sonnet for mechanical, Opus for architectural).

**On unsatisfying subagent output, change something before retrying.** Same prompt + same model + same agent type = same result. Escalate model tier (Sonnet → Opus), narrow the prompt, or switch agent type. Identical retries are waste.

**Dispatch independent subagents in parallel.** Multiple Agent tool_use blocks in a single assistant message run concurrently. Serial Agent dispatch across sequential turns is the default failure mode and trades wall time for nothing. If two subagents do not depend on each other's output, they belong in the same message.

**Pair `isolation: worktree` with `run_in_background: true`.** A worktree implies meaningful write work. Foregrounding it blocks the main session for the entire run. Background unless the worktree's immediate output is what you need to act on next.

**Always set `subagent_type` and `model` explicitly.** Defaulting either collapses tier choice into an invisible decision. The model and agent type are part of the spec; name them every time, even when the choice is obvious. See the existing `Subagent model tiers` section above for which tier fits which work.

## Durability

Subagent reports, mid-session realizations, "I'll remember this" — none of these outlast the session. Anything worth keeping goes into CLAUDE.md, code, docs, or a commit. If it isn't written down, it is gone.

- Problems, tech debt, issues → TODO.md now, in the same response
- Design decisions, key insights → docs/ or CLAUDE.md
- Future/deferred scope → TODO.md **before** writing any code, not after
- **Every observed problem → TODO.md. No exceptions.** Code comments and conversation mentions are not tracked items.

**Commit completed work immediately.** After tests pass, commit. After each phase of a multi-phase plan, commit. Uncommitted work is lost work, and accumulated uncommitted phases lose isolation as well.

**Docs change in the same commit as the code.** New pages enter the sidebar in that commit. There is no follow-up.

## Authenticity

When asked to analyze X, read X. Do not synthesize from conversation memory, prior summaries, or what the file probably says. Claims must correspond to evidence produced this session.

**Something unexpected is a signal.** Surprising output, anomalous numbers, a file containing what it shouldn't — stop and find out why. Do not accept the anomaly and proceed.

**Corrections are documentation lag, not model failure.** When the same mistake recurs, the fix is writing the invariant down — not repeating the correction. Every correction that doesn't produce a CLAUDE.md edit will happen again. Exception: during active design, corrections are the work itself — don't prematurely document a design that hasn't settled yet.

## Discipline

Corrections from the user are conversation, not material for new rules. A single correction does not warrant a CLAUDE.md edit. Rules are added when a failure mode is observed repeatedly and the rule names the failure it prevents.

Do not announce actions ("I will now…"). Act.

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
