# Xstate React Calculator

Based on https://github.com/GiancarlosIO/xstate-react-calculator, but with some new functionalities and bug fixes. 

Article about this effort on [dev.to](https://dev.to/alinamihai/extending-the-functionality-of-react-calculator-xstate-example-67h)

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
* [@xstate/react](https://xstate.js.org/docs/packages/xstate-react/)
* [@xstate/inspect](https://xstate.js.org/docs/packages/xstate-inspect/)

[![Edit xstate-react-calculator](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/quizzical-bash-6j5m7?file=/src/machine.ts)

👀 See the [calculator's state machine on the XState Visualizer](https://xstate.js.org/viz/?gist=a23a0b1f4a952407e142ac53271c4308)

[![Screenshot of the calculator state machine in the Visualizer](xstate-vis.png)](https://xstate.js.org/viz/?gist=a23a0b1f4a952407e142ac53271c4308)
