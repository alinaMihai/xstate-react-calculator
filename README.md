# Xstate React Calculator

Based on https://github.com/GiancarlosIO/xstate-react-calculator, but with some new functionalities and bug fixes. 

Extra Features:

- add +/- button and handle operations with negative numbers (I used the Mac calculator as a reference for the behaviour)
- implement operations history: keep a string of all operations until user hits equals

Bug fixes:

- prevent entering multiple leading zeros
- correctly add two percentages together: e.g. 100% + 100%, should display 2
- correctly set the operator after each step of an operation: e.g. 1 - 1 + 2 / 2, should display 1
- handle decimal point for result state

Other improvements:

- add unit tests for operations history and for some bug fixes
- adjust calculator style for better eye comfort
- fix linting errors

* [XState 4.x](https://xstate.js.org/docs/)
* [Reactjs](https://reactjs.org/)
* [@xstate/react add on](https://xstate.js.org/docs/packages/xstate-react/)

