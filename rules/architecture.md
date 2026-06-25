# Product and Architecture

## Goal

Build the smallest useful slot game frontend in Cocos Creator with an independent Go game backend.

## Boundaries

- Cocos owns rendering, input, animation, client state presentation, and UI feedback.
- Go owns authoritative game rules, spin results, wallet/balance changes, and request validation.
- WebSocket is the transport, not the business API. Business logic must be callable without a socket.

## Layers

- Frontend presentation: Cocos components and scenes.
- Frontend client service: typed calls/events used by presentation code.
- Transport adapter: WebSocket connection, reconnect, encoding, request correlation.
- Backend transport: WebSocket session, message decoding, auth/session metadata.
- Backend application service: spin and balance use cases independent of WebSocket.
- Backend domain: reel math, pay evaluation, RNG boundaries, wallet state transitions.

## Initial Milestone

Create a minimal loop: connect, request spin, receive result, animate/display symbols, update balance.

