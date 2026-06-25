# WebSocket Protocol

## Shape

Use a small envelope so transport and business messages stay decoupled:

```json
{
  "id": "client-generated-id",
  "type": "spin.request",
  "payload": {}
}
```

Responses should reuse `id` when replying to a request:

```json
{
  "id": "client-generated-id",
  "type": "spin.result",
  "payload": {
    "symbols": [["A", "K", "Q"], ["WILD", "A", "K"], ["Q", "Q", "A"]],
    "balance": 990,
    "win": 10
  }
}
```

## Rules

- Keep message type names stable and version them only when behavior changes.
- Validate all client payloads on the backend.
- Keep error messages structured: `error.code`, `error.message`, and optional `error.details`.
- Do not leak RNG internals or payout implementation details to the client.

