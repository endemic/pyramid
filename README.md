# Pyramid

Web-based version of solitaire variation [Pyramid](https://en.wikipedia.org/wiki/Pyramid_(solitaire)).

The rules are as follows:

1. There are seven rows of cards, with the first row containing a single card, and the seventh containing seven (in a triangular shape).
2. The rest of the cards are put in the talon.
3. The goal of the game is to move cards in the pyramid to a single foundation -- this is done by selecting two cards that have a total value of 13. Jacks, queens and kings are worth 11, 12, and 13 respectively. Therefore a King can be moved on its own.
4. Clicking the talon will turn over three cards into the waste. These can then be used to match against other playable cards in the pyramid. Only cards that have no others in front of them may be selected. One variation of this rule is that if a card is covered by only one other card, the card behind can be used to match to 13.
5. Three card draw allows the player to cycle through the talon as many times as they wish. Single card draw only allows the talon to be cycled through once.

![Inspiration screenshot](pyramid.png)

## TODO

- [x] Fix undo -- group cards played to foundation
- [x] Ensure 1/3 card draw works correctly
- [x] only allow single talon use for 1 card draw (add a red "X" icon for empty talon)
  - [x] need to add "X" icon
- [ ] If a single card overlaps a higher one, can both be selected?
  > Several variations allow a card on the pyramid to be removed in combination with a card covered by the first, so long as neither card is covered by a card not in the combo. For example, in the case of an exposed ace resting on a queen, the queen can be removed with the ace if no other cards are covering them, but if (for example) a jack is also on the queen, the queen cannot be removed. Other versions require that both cards be fully exposed to begin with. 

  -> In Tut's Tomb, you can totally do this

- [ ] Disallow selecting cards on foundation
- [ ] Save icon files
- [ ] Ensure scoring is correct
  - seems to start on -28; every play to foundation is worth 13, clicking talon is -3
  - https://archive.org/details/TUTSTOMB
