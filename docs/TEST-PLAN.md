# Manual test plan

Acceptance checklist run before releases (tracked in issue #2). Automated rule and AI
coverage lives in `tests/`; this list covers what can only be judged in a real browser.

## Laptop — Chrome

- [ ] Place ships manually, including at edges and corners
- [ ] Place a ship over one already placed — rejected with a warning
- [ ] Rotate placements, vertical and horizontal
- [ ] Each ship occupies the right number of squares (5, 4, 3, 3, 2)
- [ ] Place ships, then clear the board
- [ ] Randomize places ships with no overlaps
- [ ] Clicking a square twice does nothing the second time
- [ ] Computer never repeats a shot
- [ ] Computer's turn is easy to follow (pause, highlighted square, recap)
- [ ] Win screen appears when the last enemy ship sinks
- [ ] Loss screen appears when the computer sinks your last ship
- [ ] Play again fully resets both boards

## Phone — iPhone / Safari

- [ ] Place ships manually by tap, including at edges and corners
- [ ] Place a ship over one already placed — rejected with a warning
- [ ] Rotate placements, vertical and horizontal
- [ ] Each ship occupies the right number of squares (5, 4, 3, 3, 2)
- [ ] Place ships, then clear the board
- [ ] Randomize places ships with no overlaps
- [ ] Tapping a square twice does nothing the second time
- [ ] Computer never repeats a shot
- [ ] Win screen appears when the last enemy ship sinks, fully visible without scrolling sideways
- [ ] Loss screen appears when the computer sinks your last ship
- [ ] Play again fully resets both boards
