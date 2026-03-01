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

## Core Rule

**Note things down immediately:**
- Bugs/issues → fix or add to TODO.md
- Design decisions → docs/ or code comments
- Future work → TODO.md
- Key insights → this file

**Triggers:** User corrects you, 2+ failed attempts, "aha" moment, framework quirk discovered → document before proceeding.

**Don't say these (edit first):** "Fair point", "Should have", "That should go in X" → edit the file BEFORE responding.

**Do the work properly.** When asked to analyze X, actually read X - don't synthesize from conversation. The cost of doing it right < redoing it.

**If citing CLAUDE.md after failing:** The file failed its purpose. Adjust it to actually prevent the failure.

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
cargo clippy --all-targets --all-features -- -D warnings && cargo test
```
After editing multiple files, run the full check once — not after each edit. Formatting is handled automatically by the pre-commit hook (`cargo fmt`).

**When making the same change across multiple crates**, edit all files first, then build once.

**Minimize file churn.** When editing a file, read it once, plan all changes, and apply them in one pass. Avoid read-edit-build-fail-read-fix cycles by thinking through the complete change before starting.

**Use `normalize view` for structural exploration:**
```bash
~/git/rhizone/normalize/target/debug/normalize view <file>    # outline with line numbers
~/git/rhizone/normalize/target/debug/normalize view <dir>     # directory structure
```

## Session Handoff

Use plan mode as a handoff mechanism when:
- A task is fully complete (committed, pushed, docs updated)
- The session has drifted from its original purpose
- Context has accumulated enough that a fresh start would help

Before entering plan mode:
- Update TODO.md with any remaining work
- Update memory files with anything worth preserving across sessions

Then enter plan mode and write a plan file that either:
- Proposes the next task if it's clear: "next up: X — see TODO.md"
- Flags that direction is needed: "task complete / session drifted — see TODO.md"

ExitPlanMode hands control back to the user to approve, redirect, or stop.

## Commit Convention

Use conventional commits: `type(scope): message`

Types:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only
- `chore` - Maintenance (deps, CI, etc.)
- `test` - Adding or updating tests

Scope is optional but recommended for multi-crate repos.

## Negative Constraints

Do not:
- Announce actions ("I will now...") - just do them
- Leave work uncommitted
- Create special cases - design to avoid them
- Create legacy APIs - one API, update all callers
- Add to the monolith - split by domain into sub-crates
- Do half measures - migrate ALL callers when adding abstraction
- Return tuples - use structs with named fields
- Mark as done prematurely - note what remains
- Consider time constraints - we're NOT short on time; optimize for correctness
- Use Dynamic rigid bodies for character controllers - use Kinematic controllers
- Use path dependencies in Cargo.toml - causes clippy to stash changes across repos
- Use `--no-verify` - fix the issue or fix the hook
- Assume tools are missing - check if `nix develop` is available for the right environment

## Design Principles

**Building blocks, not frameworks.** Users compose primitives. We don't dictate game structure.
- State machines that can drive anything (animation, AI, gameplay)
- Controllers that work with any physics backend
- Generators that output data, not side effects

**Unify, don't multiply.** One interface for multiple cases > separate interfaces. Plugin systems > hardcoded switches.

**Simplicity over cleverness.** HashMap > inventory crate. OnceLock > lazy_static. Functions > traits until you need the trait.

**Explicit over implicit.** Log when skipping. Show what's at stake before refusing.

**Separate niche from shared.** Don't bloat shared config with feature-specific data. Use separate files for specialized data.

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
