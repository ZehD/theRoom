# theRoom

Static site: `theroom.html` (imported from Claude Design) plus `audio/rain.mp3`, and two small Vercel
functions that make the room reachable by agents.
Live at https://theroom-seven-theta.vercel.app

## Human / Agent

The page opens on a black terminal in the room's accent (the same choice the room makes: `?accent=`, then the
last one, then blue) with one prompt, `are you human? [yes/no]`, and a typed answer: `yes` or `y` is a human and
starts the room's opening (After Hours: a 3.9 s construction pass, the floor lattice and every object's edges
tracing in as blue wire while the room grows up from the floor, the screens powering on last; "skip intro" or Esc
ends it); `no` or `n` is an agent and powers the agent view on through the CRT;
anything else gets an error line and the prompt again. No buttons: the room's own keyboard docks under the
prompt (see [The keyboard](#the-keyboard)). It runs from the inline script, so it is answerable before Three.js
has downloaded. A URL that names a view (`#/agent`) or a place (`#/work`) skips the question.

Three dresses for that one prompt, picked with `?gate=`:

| `?gate=` | what it is |
|----------|------------|
| `tty` (default) | a console: a banner under a hairline, three blank rows, the prompt, a status line along the foot |
| `boot` | a nameplate: the logo mark and the Doto wordmark, a rule, the prompt hanging under it |
| `crt` | a tube: the prompt printed inside a bezelled screen that powers on out of a line, status bar welded to the glass |

All three share the texture — dark scanlines that cut the glow into rows, a bed of light under the text, an
off-centre vignette, a slow roll — and the same three brightnesses: the shell prefix is furniture, the question
is live, what you type and the cursor are the hottest thing on screen. A wrong answer makes the tube flinch.

Below that, a pill at the bottom edge of the page. **Human** is the room. **Agent** leaves it: the render loop parks, the
chrome hides, and the same content (the page's `inspectables`, the one source of truth) comes back as text in one
of two dresses, switchable from inside either:

- **index** (`#/agent`): the plain-text mirror. Dotted keys, sections under rules, the whole room in one scroll,
  the visitor book and the machine endpoints at the end.
- **bios** (`#/agent/bios`): the setup utility. A POST screen the first time, then tabs (Main, Experience, Certs,
  Studies, Shelf, Sound, Desk, Exit; the stack sits inside Experience), an item pane with item-specific help, and a key legend. Keys work
  like the real thing: arrows, Enter opens a ▶ item, +/- changes a value (Phosphor and Rain are live settings
  of the room), Esc jumps to Exit, F9 loads defaults, F10 asks before it lets you out. Everything is also
  tappable.

Both open on the MCP: the index starts with a "connect your agent" box (URL, install line, tools, room.md and a
button that copies the whole `room.md` to the clipboard), and the BIOS Main tab's first rows are the server and
the same copy action. A switch made by hand goes through a CRT power-off and power-on
(two black panels close to a phosphor line, the line collapses, the view swaps, and it plays backwards);
history and reload go straight to the view. The last choice is kept in `localStorage`, so a reload lands
where you left; the URL is shareable either way.

## The keyboard

Whenever the page takes typing, a keyboard docks at the foot of the frame: at the gate, and while the shell on the
CRT is open (it slides up with the glide and the screen is framed above it). It is the "After Hours" keyboard (a
React original, delivered as `after-hours-keyboards.zip` and kept out of git like the other exports), ported to
plain JS/CSS in the page as `window.__kb`, a classic script like the gate so it works before the modules arrive.

- **Desktop**: a breadbin 64 with the full rows and a function column: `f1` help, `f3` clear, `f5` history,
  `f7` whoami (the real F1/F3/F5/F7 press them too while it is up). Physical keys press the matching cap.
- **Phones and touch screens** (and frames 650 px wide or less): the thumb board, with a tools row (Tab, Ctrl, the
  arrows), letters / `123` / `#+=` layers, Shift twice to lock, and a held ⌫ that repeats. On touch it replaces the
  OS keyboard: the fields go read-only with `inputmode=none`, so glass never raises its own (and the iPhone
  keyboard no longer pans the gate). A hardware keyboard on a tablet still types.
- The speaker button mutes the key clicks (kept in `localStorage` as `theroom.kb.sound`). The case keeps its
  blue-grey; a non-blue accent turns its hue with the room.

The shell got the keys to go with it: a real caret (← → Home End, ^A ^E), ↑ ↓ through the lines already run,
`history`, Tab completion of commands and of places after `cd`, ^C to drop a line, ^L to clear, ^U to cut to the
start. At the gate the same keys answer in one line each (Tab finishes `yes` or `no`).

## The room, for agents (MCP)

The same room, without the clicking. `room.md` is the whole room as one markdown document (experience,
stack, certifications, the paper, the shelf), generated from the page by `npm run room:md` and served
statically at `/room.md` (with `/llms.txt` pointing at it). `api/mcp.ts` serves it over MCP
(Streamable HTTP, no auth) at `/mcp`, with three tools:

| Tool | What it does |
|------|--------------|
| `whoami` | returns `room.md`, plus which visitor number you are |
| `visitors` | the visitor book: the last agents that connected, newest first (client and time; never message contents) |
| `leave_message` | leaves a private note on the desk: name, contact, message; three a day per visitor |

and two resources, `theroom://room.md` and `theroom://visitors`. Install in Claude Code:

```sh
claude mcp add --transport http theroom https://theroom-seven-theta.vercel.app/mcp
```

In claude.ai: Settings, Connectors, Add custom connector, paste the URL. Cursor and VS Code take the same
URL in their `mcp.json`. On the page, the mug ("let's talk") shows the visitor book and the install line;
in the shell, `who` and `mcp` do the same.

### The store

The visitor book and the message tray live in Upstash Redis. Without it the server still answers: `whoami`
works, `visitors` says nobody is counting, `leave_message` says nothing was saved. To wire it, install
**Upstash for Redis** from the Vercel Marketplace on the `theroom` project (Storage, Create database); it
injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
by hand), then redeploy. Keys: `theroom:visits` (last 50), `theroom:visits:total`, `theroom:messages`
(last 200, private; read them in the Upstash console), `theroom:rl:*` (rate limits).

Message forwarding is optional, set either or both and redeploy:

- `MESSAGE_WEBHOOK_URL` (+ optional `MESSAGE_WEBHOOK_SECRET`, sent as `x-theroom-secret`): a POST with the
  note as JSON, for n8n or anything similar.
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`: the note as a Telegram message.

### What this server will not do

No LLM runs on the server, so nothing here can cost money per call. Client names are attacker-controlled
text, so only known clients are ever shown by name; everything else is "an unknown client", and a visit is
counted per shown name and address per hour, so made-up names do not multiply. Rate limits (300 calls per
10 minutes per address; 3 messages a day per visitor and 12 per address) are keyed on hashed addresses and
are real only with the store; without it the only ceiling is Vercel's own function quota, and the worst
case is Vercel pausing the project. JSON-RPC batches longer than 8 messages are refused at the door, and
resources go through the same limit as tools.

## Local test before pushing

```sh
npm run dev      # static preview at http://127.0.0.1:3000 (honors the vercel.json rewrite, so / serves theroom.html)
npm run dev:mcp  # the functions at http://127.0.0.1:3100/mcp and /api/visitors (Node 22+; reads the .ts sources directly)
npm test         # room.md is fresh, root rewrite, page title, every local asset the page references
npm run typecheck
npx @modelcontextprotocol/inspector --cli http://127.0.0.1:3100/mcp --transport http --method tools/list
```

`npm run dev:vercel` runs the preview through the Vercel CLI (`vercel dev`) if you want the exact Vercel
routing layer. It needs the Vercel CLI installed and logged in to the personal account.

After a deploy, `npm run test:prod` runs the smoke test against the live site, and the inspector line above
works against `https://theroom-seven-theta.vercel.app/mcp`.

## CI/CD

- **CD (Vercel):** the Vercel project `theroom` (personal account, lacordei@gmail.com) is connected
  to the GitHub repo `ZehD/theRoom`. Every push to `main` builds and promotes a production deployment
  automatically. Every other branch or pull request gets a preview deployment with its own URL.
- **CI:** there is no GitHub Actions workflow yet; `npm test` runs locally before a push.

Workflow: edit -> `npm run room:md` if the room's content changed -> `npm test` -> commit -> push -> Vercel
deploys -> `npm run test:prod`.

## Notes

- There is no build step for the page. Vercel serves the repo root as static files and compiles `api/*.ts`
  as functions; `vercel.json` rewrites `/` to `/theroom.html` and `/mcp` to `/api/mcp`, and ships `room.md`
  with the MCP function (`includeFiles`).
- `room.md` is generated, never edited by hand: the page's `inspectables` block is the single source of
  truth, and `npm test` fails when the file is stale. The secrets are left out of it on purpose.
- The page loads Three.js from jsDelivr and fonts from Google Fonts at runtime, so it needs network access to render.
- The Claude Design export zip stays out of git (`*.zip` is ignored) because it contains process uploads.
- The room is a port of the "After Hours" design (`after-hours-source.zip`, `app/room.ts`): an orthographic
  cutaway with real lights and shadows, then ACES tone mapping and a Bayer dither pass. Its layout draws from a
  seeded RNG (1712) in call order, so an object added mid-build shifts every random value after it. Zones
  are `{ position, target, zoom }` shots in `CONFIG.camera.presets`, with `portrait` variants for phones;
  `CONFIG.room` sizes the debug grid and the close-up framing. On top of the bookcase sits the miniature-painting
  corner from the 2026-10-02 After Hours export (`after-hours-source(1).zip`); the opening is its `room-opening.ts`.

## Later

- **Rain sound is silent on Safari mobile (iOS).** Reported 2026-09-26 on `/theroom2`. The rain plays through the Web Audio
  API (`rain` in the page: an `AudioContext` plus the decoded `audio/rain.mp3`). Two likely causes to check first: iOS mutes
  Web Audio while the ring/silent switch is on (an `<audio>` element is not muted), and the context has to be created or
  resumed inside the touch gesture itself. Test on a real iPhone with the switch both ways.
