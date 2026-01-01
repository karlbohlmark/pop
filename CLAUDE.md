# vpod Project

vpod is a web-based control panel for ZTV (Zig Video Transport), a high-performance video streaming system.

## Architecture

- **vpod** (TypeScript/Bun): Web UI and REST API for managing ZTV
- **ZTV** (Zig): Video transport process in `../ztv/` - handles RTP/RIST streaming, tunnels, and io_uring-based I/O
- Communication: JSON-RPC over stdin/stdout between vpod and ZTV

### Key Files
- `src/lib/ztv-process.ts` - Spawns and manages ZTV process, handles JSON-RPC
- `src/lib/json-rpc-client.ts` - JSON-RPC client for ZTV communication
- `src/lib/types.ts` - TypeScript types for channels, tunnels, statistics
- `src/hooks/useStatistics.ts` - React hook for real-time bitrate calculation

### ZTV (in ../ztv/)
- `src/main.zig` - Main thread, command handling, ID translation
- `src/worker/worker.zig` - Worker thread, io_uring event loop
- `src/worker/rtp.zig` - RTP channel implementation, packet processing
- Build with: `cd ../ztv && zig build`

## Important Concepts

### Channels & Streams
- Channels contain inputs and outputs (streams)
- Stream IDs must be unique within a channel
- External stream IDs (API) are mapped to internal indices in ZTV

### Tunnels
- RIST tunnels provide secure transport between machines
- Client mode: connects to remote server
- Server mode: listens for incoming connections
- Tunnels and channels must be on the same worker thread for RIST I/O to work
- vpod starts ZTV with `--workers 1` to ensure this

### Statistics
- ZTV reports raw packet/byte counts
- vpod calculates bitrates from deltas between samples
- Debug endpoint: `/api/monitoring/debug` exposes raw ZTV statistics

## Development

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## Load Testing

Scripts in `scripts/` for testing tunnel bandwidth:
- `bun scripts/load-test.ts --channels N` - Create N channels with RTP generators and RIST outputs
- `bun scripts/load-test.ts --cleanup` - Remove test channels and tunnels
- `bun scripts/load-test-monitor.ts` - Real-time monitoring of tunnel statistics

## Debugging

- Check raw ZTV statistics: `curl http://localhost:3004/api/monitoring/debug | jq`
- ZTV logs to stderr with timestamps
- Common issues:
  - Tunnels/channels on different workers → use `--workers 1`
  - Stream ID conflicts → ensure unique IDs within channel
  - RIST through tunnels → packets must flow through tunnel, not direct sockets
