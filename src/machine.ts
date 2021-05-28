import { Machine, assign } from 'xstate';
import { S, E } from './machine.constants';
import { Context, CalStateSchema, CalEvent } from './machine.types';
const not = fn => (...args) => !fn(...args);
const isZero = (_, event) =>  event.key === 0;
const isNotZero = not(isZero);
const isNegative = (context) => context.display.indexOf('-') !== -1;
const isNotNegative = (context) => not(isNegative)(context) && not(isDisplayZero)(context);
const isDisplayZero = (context) => context.display === '0.';
const isNotDisplayZero = not(isDisplayZero);
const divideByZero = (context, _) => {
  // it has to be display because the cond is executed before the display is saved as operand2 in the transition actions
  return (
    (!context.display || context.display === '0.') && context.operator === '/'
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

function addDecimalPoint(aNumber) {
  return aNumber.toString().indexOf('.') === -1 ? `${aNumber.toString()}.` : aNumber.toString();
}

export function addOperatorToHistory(history, operator) {
  const removeSpacesHistory = history.trim(); //history is trimmed so the last character can be an operator instead of space
  const lastInput = removeSpacesHistory.slice(removeSpacesHistory.length-1);
  if(isOperator(lastInput)) {
    return removeSpacesHistory.slice(0, removeSpacesHistory.length-1) + operator + " ";
  } else {
    return removeSpacesHistory +  " " + operator + " ";
  }
}

export function removeNumberFromHistory(history) {
  // The space is important when calculating where the last operator is!
  if(history.lastIndexOf(' ') != -1) {
    // if there was a previous operator, remove number after operator
    const lastOperatorEnd = history.lastIndexOf(' ');
    return history.slice(0, lastOperatorEnd + 1);
  }
  return '';
}

export function replaceNumberInHistory(history, key) {
  // The space is important when calculating where the last operator is!
  if(history.lastIndexOf(' ') != -1) {
    // if there was a previous operator, replace number after operator with new number
    const lastOperatorEnd = history.lastIndexOf(' ');
    return history.slice(0, lastOperatorEnd) + ' ' + key + '.';
  }
  return key != undefined ? `${key}.`: '';
}

export function convertNumberToNegativeInHistory(history) {
  const lastOperatorEnd = history.lastIndexOf(' ');
  const isLastNumberNegative = history.lastIndexOf(')') == history.length - 1;
  if(isLastNumberNegative) {
    return history;
  }
  if(lastOperatorEnd !== -1) {
    return history.slice(0, lastOperatorEnd + 1) +
    `(-${history.slice(lastOperatorEnd + 1)})`
  }
  else {
    return `(-${history})`;
  }
}
export function convertNumberToPositiveInHistory(history) {
  const lastNegativeNumberStart = history.lastIndexOf("(-");
  const lastNegativeNumberEnd = history.lastIndexOf(")");
  if(lastNegativeNumberEnd == -1) {
    return history;
  }
  return (
    history.slice(0, lastNegativeNumberStart) +
    history.slice(lastNegativeNumberStart + 2, lastNegativeNumberEnd)
  );
}

export function handleSecondOperandDecimalPoint(history) {
  const temp_history = removeNumberFromHistory(history);
  return temp_history + '0.';
}

export function computePercentage(context) {
  const operationNumbers = context.historyInput!.replace('(','').replace(')', '')!.split((/\s\+\s|\s-\s|\sx\s|\s\/\s/));
  const hasOperator = operationNumbers.length > 1;
  let percentage = +context.display/100; 
  if(hasOperator) {
     const total = +context.operand1;
     percentage = total + ((+context.display/100) * total);
  }
  return percentage.toString();
}


const calMachine = Machine<Context, CalStateSchema, CalEvent>(
  {
    id: 'calcMachine',
    context: {
      display: '0.',
      operand1: undefined,
      operand2: undefined,
      operator: undefined,
      historyInput: '0.'
    },
    strict: true,
    initial: S.start,
    on: {
      [E.CLEAR_EVERYTHING]: {
        target: `.${S.start}`,
        actions: ['reset'],
      },
    },
    states: {
      [S.start]: {
        on: {
          [E.NUMBER]: [
            {
              cond: 'isZero',
              target: `${S.operand1}.${S.zero}`,
              actions: ['defaultReadout', 'defaultReadoutHistory'],
            },
            {
              cond: 'isNotZero',
              target: `${S.operand1}.${S.before_decimal_point}`,
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          [E.DECIMAL_POINT]: {
            target: `${S.operand1}.${S.after_decimal_point}`,
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
        },
      },
      [S.operand1]: {
        on: {
          [E.OPERATOR]: {
            target: S.operator_entered,
            actions: ['recordOperator'],
          },
          [E.TOGGLE_SIGN]: {
              cond: 'isNotDisplayZero',
              target: S.negative_number,
              actions: ['toggleSign', 'convertNumberToNegativeInHistory'],
          },
          [E.PERCENTAGE]: {
            target: S.result,
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
          [E.CLEAR_ENTRY]: {
            target: S.operand1,
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
        },
        initial: S.zero,
        states: {
          [S.zero]: {
            on: {
              [E.NUMBER]: [{
                cond: 'isZero',
                target: S.zero,
                actions: ['setReadoutNum', 'replaceLastNumberHistory'],
              }, {
                target: S.before_decimal_point,
                actions: ['setReadoutNum', 'replaceLastNumberHistory'],
              }],
              [E.DECIMAL_POINT]: S.after_decimal_point,
            },
          },
          [S.before_decimal_point]: {
            on: {
              [E.NUMBER]: {
                target: S.before_decimal_point,
                actions: ['appendNumBeforeDecimal', 'addHistoryBeforeDecimalPoint'],
              },
              [E.DECIMAL_POINT]: S.after_decimal_point,
            },
          },
          [S.after_decimal_point]: {
            on: {
              [E.NUMBER]: {
                target: S.after_decimal_point,
                actions: ['appendNumAfterDecimal', 'addHistoryAfterDecimalPoint'],
              },
            },
          },
        },
      },
      [S.negative_number]: {
        on: {
          [E.NUMBER]: [
            {
              cond: 'isZero',
              target: `${S.operand1}.${S.zero}`,
              actions: ['defaultReadout', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: `${S.operand1}.${S.before_decimal_point}`,
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          [E.DECIMAL_POINT]: {
            target: `${S.operand1}.${S.after_decimal_point}`,
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
          [E.CLEAR_ENTRY]: {
            target: S.start,
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
          [E.TOGGLE_SIGN]: {
            target: S.operand1,
            actions: ['toggleSign', 'convertNumberToPositiveInHistory'],
          },
          [E.OPERATOR]: {
            target: S.operator_entered,
            actions: ['recordOperator'],
          },
          [E.PERCENTAGE]: {
            target: S.result,
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
        },
      },
      [S.operator_entered]: {
        on: {
          [E.OPERATOR]: [
            {
              target: S.operator_entered,
              actions: 'setOperator',
            },
          ],
          [E.NUMBER]: [
            {
              cond: 'isZero',
              target: `${S.operand2}.${S.zero}`,
              actions: ['defaultReadout', 'saveOperand2', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: `${S.operand2}.${S.before_decimal_point}`,
              actions: ['setReadoutNum', 'saveOperand2', 'replaceLastNumberHistory'],
            },
          ],
          [E.DECIMAL_POINT]: {
            target: `${S.operand2}.${S.after_decimal_point}`,
            actions: ['defaultReadout', 'zeroSecondOperandAddToHistory'],
          },
        },
      },
      [S.operand2]: {
        on: {
          [E.OPERATOR]: [
            {
              cond: 'notDivideByZero',
              target: S.operator_entered,
              actions: [
                'storeResultAsOperand2',
                'compute',
                'storeResultAsOperand1',
                'setOperator',
              ],
            },
            {
              target: S.alert,
            },
          ],
          [E.TOGGLE_SIGN]: {
              cond: 'isNotDisplayZero',
              target: S.negative_number_2,
              actions: ['toggleSign', 'convertNumberToNegativeInHistory'],
          },
          [E.EQUALS]: [
            {
              cond: 'notDivideByZero',
              target: S.result,
              actions: ['storeResultAsOperand2', 'compute', 'resultHistory'],
            },
            {
              target: S.alert,
            },
          ],
          [E.PERCENTAGE]: {
            target: S.result,
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
          [E.CLEAR_ENTRY]: {
            target: `${S.operand2}.${S.zero}`,
            actions: ['defaultReadout', 'removeLastNumberHistory'],
          },
        },
        initial: S.zero,
        states: {
          [S.zero]: {
            on: {
              [E.NUMBER]: [
                {
                  cond:'isZero',
                  target: S.zero,
                  actions: ['setReadoutNum', 'replaceLastNumberHistory'],
                },
                {
                target: S.before_decimal_point,
                actions: ['setReadoutNum', 'replaceLastNumberHistory'],
              }],
              [E.DECIMAL_POINT]: S.after_decimal_point,
            },
          },
          [S.before_decimal_point]: {
            on: {
              [E.NUMBER]: {
                target: S.before_decimal_point,
                actions: ['appendNumBeforeDecimal', 'addHistoryBeforeDecimalPoint'],
              },
              [E.DECIMAL_POINT]: S.after_decimal_point,
            },
          },
          [S.after_decimal_point]: {
            on: {
              [E.NUMBER]: {
                target: S.after_decimal_point,
                actions: ['appendNumAfterDecimal', 'addHistoryAfterDecimalPoint'],
              },
            },
          },
        },
      },
      [S.negative_number_2]: {
        on: {
          [E.OPERATOR]: [
            {
              cond: 'notDivideByZero',
              target: S.operator_entered,
              actions: [
                'storeResultAsOperand2',
                'compute',
                'storeResultAsOperand1',
                'setOperator',
              ],
            },
            {
              target: S.alert,
            },
          ],
          [E.EQUALS]: [
            {
              cond: 'notDivideByZero',
              target: S.result,
              actions: ['storeResultAsOperand2', 'compute', 'resultHistory'],
            },
            {
              target: S.alert,
            },
          ], 
          [E.NUMBER]: [
            {
              cond: 'isZero',
              target: `${S.operand2}.${S.zero}`,
              actions: ['defaultReadout', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: `${S.operand2}.${S.before_decimal_point}`,
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          [E.TOGGLE_SIGN]: {
            target: S.operand2,
            actions: ['toggleSign', 'convertNumberToPositiveInHistory'],
          },
          [E.DECIMAL_POINT]: {
            target: `${S.operand2}.${S.after_decimal_point}`,
            actions: ['defaultReadout', 'handleSecondOperandDecimalPoint'],
          },
          [E.CLEAR_ENTRY]: {
            target: S.operator_entered,
            actions: ['defaultReadout', 'removeLastNumberHistory'],
          },
          [E.PERCENTAGE]: {
            target: S.result,
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
        },
      },
      [S.result]: {
        on: {
          [E.NUMBER]: [
            {
              cond: 'isZero',
              target: S.operand1,
              actions: ['defaultReadout', 'replaceLastNumberHistory'],
            },
            {
              cond: 'isNotZero',
              target: `${S.operand1}.${S.before_decimal_point}`,
              actions: ['setReadoutNum', 'replaceLastNumberHistory'],
            },
          ],
          [E.TOGGLE_SIGN]: [
            {
              cond: 'isNegative',
              target: S.operand1,
              actions: ['toggleSign', 'convertNumberToPositiveInHistory'],
            },
            {
              cond: 'isNotNegative',
              target: S.negative_number,
              actions: ['toggleSign', 'convertNumberToNegativeInHistory'],
            },
          ],
          [E.DECIMAL_POINT]: {
            target: `${S.operand1}.${S.after_decimal_point}`,
            actions: ['defaultReadout', 'defaultReadoutHistory']
          },
          [E.PERCENTAGE]: {
            target: S.result,
            actions: ['storeResultAsOperand2', 'computePercentage', 'addPercentageToHistory'],
          },
          [E.OPERATOR]: {
            target: S.operator_entered,
            actions: ['storeResultAsOperand1', 'recordOperator'],
          },
          [E.CLEAR_ENTRY]: {
            target: S.start,
            actions: ['defaultReadout', 'defaultReadoutHistory'],
          },
        },
      },
      [S.alert]: {
        invoke: {
          src: () => () => {
            // eslint-disable-next-line no-alert
            alert('Cannot divide by zero!');
            return Promise.resolve();
          },
          onDone: {
            target: S.start,
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
      isNegative,
      isNotNegative,
      isNotDisplayZero
    },
    actions: {
      defaultReadout: assign({
        display: () => '0.'
      }),
      defaultReadoutHistory: assign({
        historyInput: (_) =>  '0.'
      }),
      appendNumBeforeDecimal: assign({
        display: (context, event) => {
          // from '123.' => '1234.'  
          return `${context.display.slice(0, -1)}${event.key}.`;
        },
      }),
      appendNumAfterDecimal: assign({
        display: (context, event) =>  `${context.display}${event.key}`
      }),
      addHistoryAfterDecimalPoint: assign({
        historyInput: (context, event) =>  `${context.historyInput}${event.key}`
      }),
      addHistoryBeforeDecimalPoint: assign({
        historyInput: (context, event) =>  `${context.historyInput!.slice(0, -1)}${event.key}.`
      }),
      setReadoutNum: assign({
        display: (_, event) => `${event.key}.`
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
        operator: (_, event) => event.operator,
        historyInput: (context, event) =>  addOperatorToHistory(context.historyInput, event.operator)
      }),
      setOperator: assign({
        operator: (_, event) => event.operator,
        historyInput: (context, event) =>  addOperatorToHistory(context.historyInput, event.operator)
      }),
      computePercentage: assign({
        display: (context, _) => {
         return computePercentage(context);
        }
      }),
      addPercentageToHistory: assign({
        historyInput: (context) => {
          const percentageValue = +context.display > 0 ? `${context.display}` : `(${context.display})`;
          return percentageValue;
        }
      }),
      compute: assign({
        display: (context, _) => {
          const result = doMath(
            context.operand1,
            context.operand2,
            context.operator,
          );

          console.log(
            `doing calculation ${context.operand1} ${context.operator} ${context.operand2} = ${result}`,
          );

          return addDecimalPoint(result);
        },
      }),
      resultHistory: assign({
        historyInput: (context) => +context.display >= 0 ? context.display : `(${context.display})`
      }),
      storeResultAsOperand1: assign({
        operand1: context => context.display,
      }),
      storeResultAsOperand2: assign({
        operand2: context => context.display,
      }),
      saveOperand2: assign({
        operand2: (context, _) => context.display,
      }),
      reset: assign({
        display: (_) => '0.',
        operand1: (_) => undefined,
        operand2: (_) => undefined,
        operator: (_) => undefined,
        historyInput: (_) => '0.',
      }),
      replaceLastNumberHistory: assign({
        historyInput: (context, event) => replaceNumberInHistory(context.historyInput, event.key)
      }),
      removeLastNumberHistory: assign({
        historyInput: (context) => removeNumberFromHistory(context.historyInput)
      }),
      convertNumberToNegativeInHistory: assign({
        historyInput: (context) => convertNumberToNegativeInHistory(context.historyInput)
      }),
      convertNumberToPositiveInHistory: assign({
        historyInput: (context) => convertNumberToPositiveInHistory(context.historyInput)
      }),
      handleSecondOperandDecimalPoint: assign({
        historyInput: (context) => handleSecondOperandDecimalPoint(context.historyInput)
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
    },
  },
);

export default calMachine;
