# MCP Workflow

## Installed MCPs

- Playwright MCP: browser automation and screenshot validation.
- Cocos Creator MCP: editor/project control through the Cocos extension HTTP server.

## Cocos MCP Usage

The selected Cocos MCP is `DaxianLee/cocos-mcp-server`, chosen because it is the highest-starred visible Cocos Creator MCP candidate on GitHub and targets Cocos Creator 3.8.x.

The extension exposes an MCP endpoint from inside Cocos Creator, commonly:

```text
http://127.0.0.1:3000/mcp
```

Before using Cocos MCP tools:

1. Open the project in Cocos Creator.
2. Enable the `cocos-mcp-server` extension.
3. Open `Extension > Cocos MCP Server`.
4. Start the server or enable auto-start.

## Playwright MCP Usage

Use Playwright MCP when checking the web preview/build, especially for:

- preview loads without blank canvas,
- spin button interaction,
- WebSocket connect/disconnect states,
- screenshots before/after animation-relevant changes.

