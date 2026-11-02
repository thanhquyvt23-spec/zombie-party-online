# Zombie Party Online (prototype)

Browser-based real-time co-op zombie survival for 2–5 players. Responsive PC/mobile controls.

## Run locally
1. Install Node.js 18+
2. In this folder: `npm install`
3. Run: `npm start`
4. Open `http://localhost:3000`

For friends to join online, deploy this folder to a Node.js host that supports persistent WebSocket connections (e.g. Render, Railway, Fly.io). Use the public HTTPS URL and share the room invite URL. The hosting provider may require setting `PORT`.

## Controls
- PC: WASD / arrow keys; mouse aim; hold left mouse button to shoot.
- Mobile: on-screen directional pad and FIRE.
- Room size: 2–5 players.

This is a playable prototype. It requires a public server deployment for internet multiplayer; the generated project does not itself publish a public URL.
