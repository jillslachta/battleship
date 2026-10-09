# Battleship: Bug Report and Testing Notes

**Play it:** https://jillslachta.github.io/battleship/
**Code:** https://github.com/jillslachta/battleship

## The short version

Devin built the game from my brief in one session. Then I spent three rounds playing it on my laptop and my iPhone, logging what was wrong, getting it fixed, and retesting. Three real bugs found and fixed, two usability problems found and fixed, one known issue logged, and the sound went through three completely different approaches before it was right. Along the way I used three AI tools (Devin, Devin Review, and Claude) and learned a lot about what each one is for.

## How I built and tested it

I wrote the brief, Devin came back with a plan, I approved it, and Devin built the game along with 19 automated tests covering ship placement, hits, sinking, winning, and the computer's strategy.

Then I did what a real player would do: I played full games on my laptop and my iPhone and tried to break it. I logged every issue in GitHub Issues the way I'd want a customer to report a problem: what I was doing, what happened, why it matters, a suggested fix, and a severity. Each fix came back as its own pull request, Devin Review checked every change, and I merged and retested on both devices.

## Round 1: bugs found and fixed

### 1. Red "can't place here" squares got stuck on the board
- **Who caught it:** Devin Review, in the first version, before I noticed it.
- **What happened:** if you moved the mouse off the board while hovering over a spot where a ship wouldn't fit, the red warning squares stayed on screen and could hide ships you'd already placed.
- **Why:** when the cursor left the board, the game cleared the normal preview but forgot to clear the red warning.
- **Fix:** clear both when the cursor leaves the board. (Pull request #7)

### 2. The computer's move happened too fast to notice (usability)
- **Who caught it:** me, playtesting.
- **What happened:** after my shot, the computer answered almost instantly. I honestly couldn't tell it had taken a turn.
- **Fix:** a longer pause with a pulsing "Computer is taking aim..." message, a highlight on the square the computer just fired at, and a banner that says what happened. (Pull request #8)
- **How it was checked:** Devin played a full 52-turn game and confirmed every reply paused about one second and clicks during the pause were ignored. I then replayed it myself on the live site.

### 3. The shot that ended the game disappeared (found while fixing #2)
- **Who caught it:** Devin Review, on the fix for #2.
- **What happened:** when the computer sank my last ship, the defeat screen covered the board and the new message never showed, so you couldn't see the shot that beat you.
- **Fix:** the defeat screen now names the final shot. (Pull request #8)

## Round 2: retesting on real devices

After the round-one fixes went live, I played again on both devices and found two more things.

### 4. "The fix didn't take" (twice)
- **What happened:** the first time I retested, nothing looked different. The second time, after a new merge, same thing.
- **What it actually was:** my browser was showing me a saved copy of the old game. Closing the tab completely and reopening fixed it both times.
- **Why it matters:** this is exactly what a customer would hit, and it's easy to misreport as "the fix is broken." I now check which version I'm actually looking at before I log anything.

### 5. No "you sunk it" moment on iPhone (usability)
- **Who caught it:** me, on my iPhone.
- **What happened:** the square turned dark red but nothing told me I'd sunk a ship. On a laptop the battle log is visible; on a phone it's off screen, so the best moment in Battleship just passed silently.
- **Why:** the instant I fired, the banner replaced my result with "Computer is taking aim..." so my own hit or sink only ever appeared in the log.
- **Fix:** a green pop-up over the board ("You sunk the Carrier!") that works without scrolling, and the banner now keeps my result on screen during the computer's pause. (Pull request #11)
- **A note on the sound:** on the first retest the victory tune didn't play on my iPhone. The cause was my ringer being on silent. Worth knowing: iPhones mute web games when the silent switch is on.

## Round 3: sound, three ways

I wanted sound on every shot: a missile launching, then a splash or an explosion. This took three tries, and the lesson was knowing when to change approach rather than keep iterating.

- **Try 1 (Claude): simple beeps.** A plunk for a miss, two blips for a hit. Technically fine, but it wasn't what I asked for. (Pull request #11)
- **Try 2 (Claude): computer-generated missiles and explosions, plus a composed title theme.** Better, but still sounded like a 1980s arcade cabinet. I decided generated sound was never going to get there. (Pull request #12)
- **Try 3 (Claude): real recordings.** I picked free-to-use clips from Pixabay (missile launch, explosion, war drums, war horn), and they were trimmed and timed so the explosion lands exactly when the fireball appears on the square. Hits now show a mini explosion before the red X, and the title and setup screens have a drum loop. (Pull request #13)
- **Loop polish (Devin):** the drum loop had an audible seam where it repeats. Devin is smoothing it out. *(update: in progress / done)*

One decision worth calling out: an early idea was to use the soundtrack from the 2007 Battleship video game, which is available online. It's copyrighted, and this is a public repo going to a software company, so it was set aside in favor of licensed clips with credits in the README.

## Known issue

### 6. Placing ships by hand on a phone is hard to adjust (usability, low severity)
- **What happens:** after tapping a square, the ship drops in left to right, and the only way to change it is to reset the whole board.
- **Proposed fix:** let players drag a placed ship to move it, and tap it to rotate.
- **Status:** logged and scoped, not built. Workaround: use Rotate before placing, or Randomize. (Issue #4)

Also logged, not started: a scoreboard of wins and losses (Issue #6).

## Why I used three tools

Devin built the game and fixed the first round. For rounds two and three I intentionally handed the work to a different AI tool (Claude) to see what it was like to bring a second agent into a codebase it hadn't written, which is what a real engineering team does when they mix tools. Then I sent the final audio polish back to Devin. The handoffs worked because everything lived in GitHub: issues, pull requests, and reviews are the shared language regardless of which agent did the typing.

## What I learned

- **Tests catch logic. People catch experience.** Every rules problem was covered by automated tests. Every usability problem only showed up when I played, and the biggest one only showed up on a phone.
- **Verify in the source of truth.** Twice I thought a fix hadn't worked when I was looking at a stale copy. Check the version before you file the bug.
- **Fixes create new bugs.** Improving the computer's turn broke the game-over screen. A reviewer on every change caught it before a player would have.
- **Know when to change approach, not iterate.** Two rounds of generated sound taught me that a third round wouldn't fix it. Switching to real recordings did.
- **The quality of the ticket drives the quality of the fix.** Writing issues the way a customer should got focused fixes back, from both agents.
- **Checking the work takes real time.** Directing the build was fast. Testing properly, on real devices, across three rounds, was most of the effort. And I ran out of Devin credits partway through, so I now understand consumption pricing from the buyer's side too.
