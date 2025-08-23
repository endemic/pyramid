# TODO

- [x] Fix undo -- group cards played to foundation
- [x] Ensure 1/3 card draw works correctly
- [x] only allow single talon use for 1 card draw (add a red "X" icon for empty talon)
  - [x] need to add "X" icon
- [x] If a single card overlaps a higher one, can both be selected?
  > Several variations allow a card on the pyramid to be removed in combination with a card covered by the first, so long as neither card is covered by a card not in the combo. For example, in the case of an exposed ace resting on a queen, the queen can be removed with the ace if no other cards are covering them, but if (for example) a jack is also on the queen, the queen cannot be removed. Other versions require that both cards be fully exposed to begin with.
  -> In Tut's Tomb, you can totally do this

- [x] Disallow selecting cards on foundation
- [x] Save icon files
- [ ] Ensure scoring is correct
  - seems to start on -28; every play to foundation is worth 13, clicking talon is -3
  - https://archive.org/details/TUTSTOMB
- [ ] Add <dialog>-based modal instead of `alert`
