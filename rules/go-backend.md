# Go Backend

## Defaults

- Keep backend in a separate directory such as `server/`.
- Use standard library first unless a dependency clearly improves the WebSocket or test story.
- Business logic should be unit-testable without starting a server.

## Suggested Packages

- `internal/domain`: slot math, symbols, paylines, payout evaluation.
- `internal/app`: use cases such as spin and balance.
- `internal/transport/ws`: WebSocket session handling and message routing.
- `cmd/server`: executable entrypoint.

## Testing

- Unit test domain math and payout tables directly.
- Integration test message routing separately from Cocos E2E.

