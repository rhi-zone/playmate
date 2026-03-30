# State Machines

Finite state machines for game logic.

## Core Concepts

A state machine has:
- **States** - Discrete modes of behavior
- **Transitions** - Rules for moving between states
- **Context** - External data that influences transitions

## Basic Usage

```rust
use playmate_fsm::{StateMachine, State};

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
enum DoorState {
    Closed,
    Opening,
    Open,
    Closing,
}

impl State for DoorState {
    type Context = DoorInput;

    fn update(&self, ctx: &Self::Context) -> Option<Self> {
        match self {
            Self::Closed if ctx.interact => Some(Self::Opening),
            Self::Opening if ctx.animation_complete => Some(Self::Open),
            Self::Open if ctx.interact => Some(Self::Closing),
            Self::Closing if ctx.animation_complete => Some(Self::Closed),
            _ => None,
        }
    }
}
```

## Movement FSM Pattern

For character movement:

```rust
enum MovementState {
    Idle,
    Run,
    Slide,
    BulletJump,
    AimGlide,
    WallRun,
    Fall,
}
```

Each state defines:
- Entry behavior (e.g., apply impulse on BulletJump entry)
- Update behavior (e.g., apply gravity, handle input)
- Transition conditions (e.g., grounded → Idle)

## Coyote Time

Track time since leaving ground:

```rust
struct CoyoteTime {
    timer: f32,
    threshold: f32, // e.g., 0.1 seconds
}

impl CoyoteTime {
    fn can_jump(&self) -> bool {
        self.timer < self.threshold
    }

    fn tick(&mut self, grounded: bool, dt: f32) {
        if grounded {
            self.timer = 0.0;
        } else {
            self.timer += dt;
        }
    }
}
```

## Input Buffering

Remember inputs for responsiveness:

```rust
struct InputBuffer {
    jump_buffered: Option<f32>, // time remaining
    buffer_window: f32,         // e.g., 0.15 seconds
}

impl InputBuffer {
    fn buffer_jump(&mut self) {
        self.jump_buffered = Some(self.buffer_window);
    }

    fn consume_jump(&mut self) -> bool {
        self.jump_buffered.take().is_some()
    }

    fn tick(&mut self, dt: f32) {
        if let Some(ref mut t) = self.jump_buffered {
            *t -= dt;
            if *t <= 0.0 {
                self.jump_buffered = None;
            }
        }
    }
}
```
