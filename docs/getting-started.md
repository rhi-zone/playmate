# Getting Started

Playmate supports multiple engines. Godot is the primary target for its accessibility and modding story.

## Engine Options

| Engine | Language | Status |
|--------|----------|--------|
| **Godot** | GDScript | First target |
| Bevy | Rust | Planned |
| Unity | C# | Planned |
| Love2D | Lua | Planned |

## Godot Setup

### Prerequisites

With nix flakes:
```bash
nix develop  # godot_4 included
```

Or install Godot 4 manually from [godotengine.org](https://godotengine.org/).

### Development Workflow

1. **Write GDScript patterns** - playmate provides composable utilities
2. **Test headlessly** - no editor needed for quick iteration
3. **Integrate in editor** - attach to scenes when ready

### Headless Testing

Run GDScript without opening the editor:

```bash
# Run a script directly
godot --headless --script res://tests/test_fsm.gd

# Run with quit after (for CI)
godot --headless --script res://tests/test_fsm.gd --quit
```

Example test script:
```gdscript
# tests/test_fsm.gd
extends SceneTree

func _init():
    var fsm = preload("res://addons/playmate/fsm.gd").new()
    fsm.add_state("idle")
    fsm.add_state("run")
    fsm.add_transition("idle", "run", func(): return Input.is_action_pressed("move"))

    # Test transitions
    assert(fsm.current_state == "idle")
    fsm.process(0.016)  # simulate frame
    print("FSM test passed")
    quit()
```

### Project Structure

```
my_game/
├── addons/
│   └── playmate/        # playmate GDScript library
│       ├── fsm.gd
│       ├── timing.gd
│       └── stats.gd
├── scripts/             # your game code
├── tests/               # headless test scripts
└── project.godot
```

## Rust Core (Optional)

For performance-critical features (spatial queries, pathfinding), use the Rust core via GDExtension:

```toml
# Cargo.toml
[dependencies]
playmate-spatial = "0.1"
playmate-pathfinding = "0.1"
godot = "0.2"  # gdext
```

The GDScript layer calls into Rust for heavy computation while keeping game logic moddable.

## Next Steps

- [State Machines](/primitives/state-machines) - FSM patterns
- [Character Controllers](/primitives/character-controllers) - Kinematic movement
- [Philosophy](/philosophy) - Design principles
