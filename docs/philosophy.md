# Philosophy

Design principles for playmate.

## Building Blocks, Not Frameworks

Playmate provides primitives. Users compose them.

- State machines that can drive anything (animation, AI, gameplay)
- Controllers that work with any physics backend
- Generators that output data, not side effects

We don't dictate game structure. We provide the Lego bricks.

## Kinematic Over Dynamic

For character controllers, kinematic beats dynamic:

| Approach | Pros | Cons |
|----------|------|------|
| **Kinematic** | Predictable, code-driven, "feels right" | You calculate movement yourself |
| **Dynamic** | Physically accurate | Floaty, hard to tune, unpredictable |

Use physics engines (Rapier) for collision detection. Use code for movement feel.

Warframe-style movement (bullet jumping, aim gliding, wall running) is impossible with dynamic bodies. It's pure kinematic - every velocity vector calculated explicitly.

## Hot-Reloadable Feel

Iteration speed matters. You can't feel a game by reading code.

**The Setup:**
- Logic (Rust): FSMs, vector math, state transitions
- Parameters (Assets): `movement.ron` - jump_force, slide_decay, gravity
- Bridge: Hot-reload config on save

**The Workflow:**
1. Write the logic once
2. Run the game
3. Tweak `bullet_jump_force` from 10.0 to 50.0
4. Instantly feel the difference

No recompile. No restart. Immediate feedback.

## State Machines for Behavior

LLMs excel at generating clean FSMs. So do humans. They're explicit, debuggable, composable.

```rust
enum MovementState {
    Idle,
    Run,
    Slide,
    BulletJump,
    WallRun,
}
```

Each state owns its behavior. Transitions are explicit. Edge cases are visible.

**Bad:** "Can I double jump after a wall hop but not after a bullet jump?"
→ Hidden in spaghetti logic

**Good:** State machine with explicit `can_double_jump` per state
→ Visible, testable, debuggable

## Engine Agnostic

No engine dependencies in core playmate crates.

- Use `glam` for math (shared by Bevy, macroquad, rend3, others)
- Use `serde` for serialization (works everywhere)
- Integration crates (e.g., `playmate-bevy`) provide engine-specific adapters

Playmate works with any Rust game engine or no engine at all.

## General Internal, Constrained APIs

Store the general representation, expose simpler APIs for common cases.

Internal complexity, external simplicity. Power users can access the general form.
