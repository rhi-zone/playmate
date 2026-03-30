# Architecture

Technical architecture of playmate.

## Layer Structure

```
playmate/
├── core/                    # Pure Rust, no engine deps
│   ├── playmate-spatial/       # Quadtree, BVH, spatial hash
│   ├── playmate-pathfinding/   # A*, flow fields, nav mesh
│   └── playmate-math/          # Kinematic helpers, curves
│
├── bindings/                # Engine-specific adapters
│   ├── playmate-godot/         # GDExtension
│   ├── playmate-bevy/          # Bevy systems/components
│   ├── playmate-unity/         # NativePlugin + C# wrapper
│   └── playmate-love/          # Lua FFI for Love2D
│
├── scripting/               # Game logic in engine-native languages
│   ├── playmate-gdscript/      # GDScript library
│   ├── playmate-lua/           # Lua patterns (Love2D, etc.)
│   └── playmate-csharp/        # C# patterns (Unity)
│
└── docs/                    # Universal patterns, language-agnostic
```

## What Lives Where

| Layer | Contents | Why |
|-------|----------|-----|
| **core/** | Spatial, pathfinding, math | Perf-critical, complex algorithms, called 1000s/frame |
| **bindings/** | Engine glue | Thin adapters to expose core to each engine |
| **scripting/** | FSM, stats, inventory, timing, damage | Game logic, moddable, rapid iteration |
| **docs/** | Camera, coyote time, patterns | Universal knowledge, any language |

**Rule of thumb:** If modders should be able to change it, it's scripting. If it needs to be fast, it's core.

## Core Dependencies

- `glam` - Math types (shared by Bevy, macroquad, rend3, others)
- `serde` - Serialization for config files
- `thiserror` - Error handling

## Engine Targets

| Engine | Binding | Scripting | Status |
|--------|---------|-----------|--------|
| **Godot** | GDExtension | GDScript | First target |
| Bevy | bevy_ecs | (Rust) | Planned |
| Unity | NativePlugin | C# | Planned |
| Love2D | Lua FFI | Lua | Planned |

## Godot Integration

### GDScript (scripting/)

Game logic lives in GDScript for moddability:

```gdscript
# FSM for movement states
extends Node
var fsm = preload("res://addons/playmate/fsm.gd").new()

func _ready():
    fsm.add_state("idle")
    fsm.add_state("run")
    fsm.set_initial("idle")
```

### GDExtension (bindings/)

Performance-critical code in Rust, exposed to GDScript:

```rust
// bindings/playmate-godot/src/lib.rs
use godot::prelude::*;

#[derive(GodotClass)]
#[class(base=Node)]
struct SpatialIndex { ... }

#[godot_api]
impl SpatialIndex {
    #[func]
    fn query_radius(&self, center: Vector2, radius: f32) -> Array<i64> { ... }
}
```

### Headless Testing

Test without the editor:

```bash
godot --headless --script res://tests/test_fsm.gd --quit
```

## Configuration

Tunable parameters live in asset files, not code.

```ron
// movement.ron
MovementConfig(
    jump_force: 15.0,
    gravity: 40.0,
    slide_decay: 0.95,
)
```

Load via `serde` in Rust or `ConfigFile` in GDScript.
