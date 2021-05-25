import { Machine, assign } from 'xstate';

const not = fn => (...args) => !fn(...args);
const isZero = (context, event) =>  event.key === 0;
const isNotZero = not(isZero);
const divideByZero = (context, event) => {
  return (
    (!context.operand2 || context.operand2 === '0.') && context.operator === '/'
  );
};
const notDivideByZero = not(divideByZero);

function doMath(operand1, operand2, operator) {
  switch (operator) {
    case '+':
      return +operand1 + +operand2;
    case '-':
      return +operand1 - +operand2;
    case '/':
      return +operand1 / +operand2;
    case 'x':
      return +operand1 * +operand2;
    default:
      return Infinity;
  }
}

export function isOperator(text) {
  return '+-x/'.indexOf(text) > -1;
}

function addOperatorToHistory(history, operator) {
  const removeSpacesHistory = history.trim();
  const lastInput = removeSpacesHistory.slice(removeSpacesHistory.length-1);
  if(isOperator(lastInput)) {
    return removeSpacesHistory.slice(0, removeSpacesHistory.length-1) + " " + operator + " ";
  } else {
    return removeSpacesHistory +  " " + operator + " ";
  }
}

function removeNumberFromHistory(history) {
  // The space is important when calculating where the last operator is!
  if(history.lastIndexOf(' ')!= -1) {
    // if there was a previous operator, remove number after operator
    const lastOperatorEnd = history.lastIndexOf(' ');
    return history.slice(0, lastOperatorEnd+1);
  }
  return '';
}

function replaceNumberInHistory(history, key) {
  // The space is important when calculating where the last operator is!
  if(history.lastIndexOf(' ')!=-1) {
    // if there was a previous operator, replace number after operator with new number
    const lastOperatorEnd = history.lastIndexOf(' ');
    return history.slice(0, lastOperatorEnd) + ' ' + key + '.';
  }
  return key != undefined ? `${key}.`: '';
}

function convertNumberToNegativeInHistory(history) {
  const lastOperatorEnd = history.lastIndexOf(' ');
  if(lastOperatorEnd !== -1) {
    return history.slice(0, lastOperatorEnd + 1) + " " +
    `(-${history.slice(lastOperatorEnd + 1)})`
  }
  else {
    return `(-${history})`;
  }
}
function convertNumberToPositiveInHistory(history) {
  const lastNegativeNumberStart = history.lastIndexOf("(-");
  const lastNegativeNumberEnd = history.lastIndexOf(")");
  return (
    history.slice(0, lastNegativeNumberStart) +
    history.slice(lastNegativeNumberStart + 2, lastNegativeNumberEnd)
  );
}

function handleSecondOperandDecimalPoint(history) {
  const temp_history = removeNumberFromHistory(history);
  return temp_history + '0.';
}

type Context = {
  display: string;
  operand1?: string;
  operand2?: string;
  operator?: string;
  historyInput?:string;
};

const calMachine = Machine<Context>(
  {
    id: 'calcMachine',
    context: {
      display: '0.',
      operand1: undefined,
      operand2: undefined,
      operator: undefined,
      historyInput: '',
    },
    strict: true,
    initial: 'start',
    on: {
      CLEAR_EVERYTHING: {
        target: '.start',
        actions: ['reset'],
      },
    },
    states: {
      start: {
        on: {
          NUMBER: [
            {
              cond: 'isZero',
              target: 'start',
              actions: ['defaultReadout', 'defaultReadoutHistory'],
            },
            {
              cond: 'isNotZero',
              target: 'operand1.before_decimal_point',
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          DECIMAL_POINT: {
            target: 'operand1.after_decimal_point',
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
        },
      },
      operand1: {
        on: {
          OPERATOR: {
            target: 'operator_entered',
            actions: ['recordOperator'],
          },
          TOGGLE_SIGN: {
              target: 'negative_number',
              actions: ['toggleSign', 'convertNumberToNegativeInHistory'],
          },
          PERCENTAGE: {
            target: 'result',
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
          CLEAR_ENTRY: {
            target: 'operand1',
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
        },
        initial: 'zero',
        states: {
          zero: {
            on: {
              NUMBER: {
                target: 'before_decimal_point',
                actions: ['setReadoutNum', 'replaceLastNumberHistory'],
              },
              DECIMAL_POINT: 'after_decimal_point',
            },
          },
          before_decimal_point: {
            on: {
              NUMBER: {
                target: 'before_decimal_point',
                actions: ['appendNumBeforeDecimal', 'addHistoryBeforeDecimalPoint'],
              },
              DECIMAL_POINT: 'after_decimal_point',
            },
          },
          after_decimal_point: {
            on: {
              NUMBER: {
                target: 'after_decimal_point',
                actions: ['appendNumAfterDecimal', 'addHistoryAfterDecimalPoint'],
              },
            },
          },
        },
      },
      negative_number: {
        on: {
          NUMBER: [
            {
              cond: 'isZero',
              target: 'operand1.zero',
              actions: ['defaultReadout', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: 'operand1.before_decimal_point',
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          DECIMAL_POINT: {
            target: 'operand1.after_decimal_point',
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
          CLEAR_ENTRY: {
            target: 'start',
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
          TOGGLE_SIGN: {
            target: 'operand1',
            actions: ['toggleSign', 'convertNumberToPositiveInHistory'],
          },
          OPERATOR: {
            target: 'operator_entered',
            actions: ['recordOperator'],
          },
          PERCENTAGE: {
            target: 'result',
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
        },
      },
      operator_entered: {
        on: {
          OPERATOR: [
            {
              target: 'operator_entered',
              actions: 'setOperator',
            },
          ],
          NUMBER: [
            {
              cond: 'isZero',
              target: 'operator_entered',
              actions: ['defaultReadout', 'saveOperand2', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: 'operand2.before_decimal_point',
              actions: ['setReadoutNum', 'saveOperand2', 'replaceLastNumberHistory'],
            },
          ],
          DECIMAL_POINT: {
            target: 'operand2.after_decimal_point',
            actions: ['defaultReadout', 'zeroSecondOperandAddToHistory'],
          },
        },
      },
      operand2: {
        on: {
          OPERATOR: [
            {
              cond: 'notDivideByZero',
              target: 'operator_entered',
              actions: [
                'storeResultAsOperand2',
                'compute',
                'storeResultAsOperand1',
                'setOperator',
              ],
            },
            {
              target: 'alert',
            },
          ],
          TOGGLE_SIGN: {
              target: 'negative_number_2',
              actions: ['toggleSign', 'convertNumberToNegativeInHistory'],
          },
          EQUALS: [
            {
              cond: 'notDivideByZero',
              target: 'result',
              actions: ['storeResultAsOperand2', 'compute', 'clearHistory'],
            },
            {
              target: 'alert',
            },
          ],
          PERCENTAGE: {
            target: 'operand2',
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
          CLEAR_ENTRY: {
            target: 'operand2.zero',
            actions: ['defaultReadout', 'removeLastNumberHistory'],
          },
        },
        initial: 'zero',
        states: {
          zero: {
            on: {
              NUMBER: {
                target: 'before_decimal_point',
                actions: ['setReadoutNum', 'replaceLastNumberHistory'],
              },
              DECIMAL_POINT: 'after_decimal_point',
            },
          },
          before_decimal_point: {
            on: {
              NUMBER: {
                target: 'before_decimal_point',
                actions: ['appendNumBeforeDecimal', 'addHistoryBeforeDecimalPoint'],
              },
              DECIMAL_POINT: 'after_decimal_point',
            },
          },
          after_decimal_point: {
            on: {
              NUMBER: {
                target: 'after_decimal_point',
                actions: ['appendNumAfterDecimal', 'addHistoryAfterDecimalPoint'],
              },
            },
          },
        },
      },
      negative_number_2: {
        on: {
          OPERATOR: [
            {
              cond: 'notDivideByZero',
              target: 'operator_entered',
              actions: [
                'storeResultAsOperand2',
                'compute',
                'storeResultAsOperand1',
                'setOperator',
              ],
            },
            {
              target: 'alert',
            },
          ],
          EQUALS: [
            {
              cond: 'notDivideByZero',
              target: 'result',
              actions: ['storeResultAsOperand2', 'compute', 'clearHistory'],
            },
            {
              target: 'alert',
            },
          ], 
          NUMBER: [
            {
              cond: 'isZero',
              target: 'operand2.zero',
              actions: ['defaultReadout', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: 'operand2.before_decimal_point',
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          TOGGLE_SIGN: {
            target: 'operand2',
            actions: ['toggleSign', 'convertNumberToPositiveInHistory'],
          },
          DECIMAL_POINT: {
            target: 'operand2.after_decimal_point',
            actions: ['defaultReadout', 'handleSecondOperandDecimalPoint'],
          },
          CLEAR_ENTRY: {
            target: 'operator_entered',
            actions: ['defaultReadout', 'removeLastNumberHistory'],
          },
          PERCENTAGE: {
            target: 'operand2',
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
        },
      },
      result: {
        on: {
          NUMBER: [
            {
              cond: 'isZero',
              target: 'operand1',
              actions: ['defaultReadout', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: 'operand1.before_decimal_point',
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          TOGGLE_SIGN: {
            actions: ['toggleSign']
          },
          PERCENTAGE: {
            target: 'result',
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
          OPERATOR: {
            target: 'operator_entered',
            actions: ['storeResultAsOperand1', 'recordOperator'],
          },
          CLEAR_ENTRY: {
            target: 'start',
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
        },
      },
      alert: {
        invoke: {
          src: (context, event) => () => {
            // eslint-disable-next-line no-alert
            alert('Cannot divide by zero!');
            return Promise.resolve();
          },
          onDone: {
            target: 'start',
            actions: ['reset'],
          },
        },
      },
    },
  },
  {
    guards: {
      isZero,
      isNotZero,
      notDivideByZero,
    },
    actions: {
      defaultReadout: assign({
        display: () => {
          console.log('defaultReadout');

          return '0.';
        },
      }),
      appendNumBeforeDecimal: assign({
        display: (context, event) => {
          // from '123.' => '1234.'
          return `${context.display.slice(0, -1)}${event.key}.`;
        },
      }),

      appendNumAfterDecimal: assign({
        display: (context, event) => {
          return `${context.display}${event.key}`;
        },
      }),

      setReadoutNum: assign({
        display: (context, event) => {
          return `${event.key}.`;
        }
      }),
      toggleSign: assign({
        display: (context) => {
          if (context.display.indexOf('-') !== -1) {
            return context.display.replace('-', '');
          } 
          return `-${context.display}`
        } 
      }),
      recordOperator: assign({
        operand1: context => context.display,
        operator: (context, event) => event.operator,
        historyInput: (context, event) => {
         return addOperatorToHistory(context.historyInput, event.operator);
        },
      }),

      setOperator: assign({
        operator: (context, event) => event.operator,
        historyInput: (context, event) => {
          return addOperatorToHistory(context.historyInput, event.operator);
        },
      }),

      computePercentage: assign({
        display: (context, event) => (+context.display / 100).toString(),
      }),

      compute: assign({
        display: (context, event) => {
          const result = doMath(
            context.operand1,
            context.operand2,
            context.operator,
          );

          console.log(
            `doing calculation ${context.operand1} ${context.operator} ${context.operand2} = ${result}`,
          );

          return result.toString();
        },
      }),

      storeResultAsOperand1: assign({
        operand1: context => context.display,
      }),

      storeResultAsOperand2: assign({
        operand2: context => context.display,
      }),

      saveOperand2: assign({
        operand2: (context, event) => context.display,
      }),
      clearHistory: assign({
        historyInput: (context) => context.display
      }),
      addPercentageToHistory: assign({
        historyInput: context => context.historyInput + '%'
      }),
      reset: assign({
        display: (context, event) => '0.',
        operand1: (context, event) => undefined,
        operand2: (context, event) => undefined,
        operator: (context, event) => undefined,
        historyInput: (context, event) => ''
      }),
      replaceLastNumberHistory: assign({
        historyInput: (context, event) => {
          return replaceNumberInHistory(context.historyInput, event.key)
        }
      }),
      removeLastNumberHistory: assign({
        historyInput: (context) => {
          return removeNumberFromHistory(context.historyInput)
        }
      }),
      convertNumberToNegativeInHistory: assign({
        historyInput: (context) => {
          return convertNumberToNegativeInHistory(context.historyInput)
        }
      }),
      convertNumberToPositiveInHistory: assign({
        historyInput: (context) => {
          return convertNumberToPositiveInHistory(context.historyInput)
        }
      }),
      handleSecondOperandDecimalPoint: assign({
        historyInput: (context) => {
          return handleSecondOperandDecimalPoint(context.historyInput)
        }
      }),
      defaultReadoutHistory: assign({
        historyInput: (context) =>  '0.'
      }),
      zeroSecondOperandAddToHistory: assign({
        historyInput: (context) => {
          // add it only once
          if(context.historyInput!.lastIndexOf('0.') !== context.historyInput!.length - 2) {
            return context.historyInput + `0.`;
          } else {
            return context.historyInput;
          }
        }
      }),
      addHistoryAfterDecimalPoint: assign({
        historyInput: (context, event) => {
          return `${context.historyInput}${event.key}`}
      }),
      addHistoryBeforeDecimalPoint: assign({
        historyInput: (context, event) => {
          return `${context.historyInput!.slice(0, -1)}${event.key}.`
        }
      }),
    },
  },
);

export default calMachine;
