# Prior Art

Existing solutions and how playmate relates.

## State Machines

| Library | Approach | Playmate Relation |
|---------|----------|----------------|
| `bevy_state` | Bevy-native states | Inspiration; playmate is engine-agnostic |
| `statig` | Hierarchical FSM | Reference for advanced patterns |
| `seldom_state` | Bevy state plugin | Similar goals, different scope |

## Character Controllers

| Library | Approach | Playmate Relation |
|---------|----------|----------------|
| `bevy_rapier` KCC | Rapier-integrated | Playmate wraps physics-agnostic logic |
| `bevy_xpbd` character | XPBD-based | Alternative physics backend |
| Godot CharacterBody3D | Engine-integrated | Inspiration for API |

## Procedural Generation

| Library | Approach | Playmate Relation |
|---------|----------|----------------|
| `noise` | Noise functions | Dependency |
| `wfc` | Wave Function Collapse | Reference implementation |
| `bracket-lib` | Roguelike toolkit | Different scope (framework) |

## Game Feel References

- **Warframe** - Kinematic character controller benchmark
- **Celeste** - Coyote time, input buffering
- **Hollow Knight** - Responsive 2D movement
- **DOOM Eternal** - High-mobility FPS movement

## Why Playmate?

Existing solutions are either:
1. **Framework-bound** (Godot, Unity)
2. **Engine-specific** (bevy_rapier KCC)
3. **Too low-level** (raw physics APIs)
4. **Too high-level** (full game templates)

Playmate fills the gap: engine-agnostic primitives with game-ready APIs.
