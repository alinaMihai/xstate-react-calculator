import { interpret } from "xstate";
import calMachine, {
  addOperatorToHistory,
  isOperator,
  removeNumberFromHistory,
  replaceNumberInHistory,
  convertNumberToNegativeInHistory,
  convertNumberToPositiveInHistory,
  handleSecondOperandDecimalPoint,
} from "./machine";

describe("isOperator", () => {
  test("+ should be recognized as an operator", () => {
    const given = "+";
    const result = isOperator(given);
    expect(result).toBe(true);
  });
  test("- should be recognized as an operator", () => {
    const given = "-";
    const result = isOperator(given);
    expect(result).toBe(true);
  });
  test("/ should be recognized as an operator", () => {
    const given = "/";
    const result = isOperator(given);
    expect(result).toBe(true);
  });
  test("x should be recognized as an operator", () => {
    const given = "x";
    const result = isOperator(given);
    expect(result).toBe(true);
  });
  test("% should not be recognized as an operator", () => {
    const given = "%";
    const result = isOperator(given);
    expect(result).toBe(false);
  });
});

describe("addOperatorToHistory", () => {
  test("given operation 1. + 2., when entering a new operator, it should be added at the end of the operation", () => {
    const givenHistory = "1. + 2.";
    const givenOperator = "+";
    const result = addOperatorToHistory(givenHistory, givenOperator);
    expect(result).toEqual("1. + 2. + ");
  });
  test("given operation 1. + 2. +, when entering a different operator, it should replace the last operator", () => {
    const givenHistory = "1. + 2. +";
    const givenOperator1 = "/";
    const result1 = addOperatorToHistory(givenHistory, givenOperator1);
    expect(result1).toEqual("1. + 2. / ");

    const givenOperator2 = "-";
    const result2 = addOperatorToHistory(result1, givenOperator2);
    expect(result2).toEqual("1. + 2. - ");

    const givenOperator3 = "x";
    const result3 = addOperatorToHistory(result2, givenOperator3);
    expect(result3).toEqual("1. + 2. x ");
  });
  test("given operation 1. + 2. +, when adding the same operator multiple times, the operator should be added only once", () => {
    const givenHistory = "1. + 2. +";
    const givenOperator = "+";
    let result = addOperatorToHistory(givenHistory, givenOperator);
    result = addOperatorToHistory(result, givenOperator);
    expect(result).toEqual("1. + 2. + ");
  });
});

describe("removeNumberFromHistory", () => {
  test("given operation 1. + 2323., it should remove the last number from the operation", () => {
    const givenHistory = "1. + 2323.";
    const result = removeNumberFromHistory(givenHistory);
    expect(result).toEqual("1. + ");
  });
  test("given operation 1. +, it should not remove any number", () => {
    const givenHistory = "1. + ";
    const result = removeNumberFromHistory(givenHistory);
    expect(result).toEqual("1. + ");
  });
});

describe("replaceNumberInHistory", () => {
  test("given operation 1. + 234., when given a new number, it should replace the last number with the new one", () => {
    const givenHistory = "1. + 234.";
    const givenNumber = "100";
    const result = replaceNumberInHistory(givenHistory, givenNumber);
    expect(result).toEqual("1. + 100.");
  });
  test("given number 123., when entering a new number, it should replace it with the new number", () => {
    const givenHistory = "123.";
    const givenNumber = "100";
    const result = replaceNumberInHistory(givenHistory, givenNumber);
    expect(result).toEqual("100.");
  });
  test("given an empty string, when entering a new number, it should add it in history", () => {
    const givenHistory = "";
    const givenNumber = "100";
    const result = replaceNumberInHistory(givenHistory, givenNumber);
    expect(result).toEqual("100.");
  });
});

describe("convertNumberToNegativeInHistory", () => {
  test("given operation 1. + 2., last number should be converted to negative", () => {
    const givenHistory = "1. + 2.";
    const result = convertNumberToNegativeInHistory(givenHistory);
    expect(result).toEqual("1. + (-2.)");
  });
  test("given number 1., it should be converted to negative", () => {
    const givenHistory = "1.";
    const result = convertNumberToNegativeInHistory(givenHistory);
    expect(result).toEqual("(-1.)");
  });
  test("given number (-1.), it should do nothing", () => {
    const givenHistory = "(-1.)";
    const result = convertNumberToNegativeInHistory(givenHistory);
    expect(result).toEqual("(-1.)");
  });
});
describe("convertNumberToPositiveInHistory", () => {
  test("given operation 1. + (-2.), last number should be converted to positive", () => {
    const givenHistory = "1. + (-2.)";
    const result = convertNumberToPositiveInHistory(givenHistory);
    expect(result).toEqual("1. + 2.");
  });
  test("given number (-1.), it should be converted to positive", () => {
    const givenHistory = "(-1.)";
    const result = convertNumberToPositiveInHistory(givenHistory);
    expect(result).toEqual("1.");
  });
  test("given number 1., it should do nothing", () => {
    const givenHistory = "1.";
    const result = convertNumberToPositiveInHistory(givenHistory);
    expect(result).toEqual("1.");
  });
});

describe("handleSecondOperandDecimalPoint", () => {
  test("given operation 1. + (-2.), when entering decimal point, it should replace the negative number with 0.", () => {
    const givenHistory = "1. + (-2.)";
    const result = handleSecondOperandDecimalPoint(givenHistory);
    expect(result).toEqual("1. + 0.");
  });
});

describe("calculator Machine scenario 1: adding two numbers with decimals", () => {
  const machine = interpret(calMachine);
  machine.start();
  test("given starting state, when entering 0, it should add 0. in history", () => {
    const result = machine.send({ type: "NUMBER", key: 0 });
    expect(result.context.historyInput).toEqual("0.");
  });
  test("given operand1.before_decimal_point, when entering a new number, it should add it in history", () => {
    const result = machine.send({ type: "NUMBER", key: 10 });
    expect(result.context.historyInput).toEqual("10.");
  });
  test("given operand1.after_decimal_point, when entering a new number, it should add it in history after the decimal point", () => {
    machine.send({ type: "DECIMAL_POINT" });
    const result = machine.send({ type: "NUMBER", key: 1 });
    expect(result.context.historyInput).toEqual("10.1");
  });
  test("given number 10.1, when entering operator +, it should add it in history", () => {
    const result = machine.send({ type: "OPERATOR", operator: "+" });
    expect(result.context.historyInput).toEqual("10.1 + ");
  });
  test("given operation 10.1 +, when entering a new number it should add it in history", () => {
    const result = machine.send({ type: "NUMBER", key: "21" });
    expect(result.context.historyInput).toEqual("10.1 + 21.");
  });
  test("given operation 10.1 + 21, when entering a new number after decimal point it should add it in history", () => {
    machine.send({ type: "DECIMAL_POINT" });
    const result = machine.send({ type: "NUMBER", key: "1" });
    expect(result.context.historyInput).toEqual("10.1 + 21.1");
  });
  test("given operation 10.1 + 21.1, when entering equals, it should show the result in history", () => {
    const result = machine.send({ type: "EQUALS" });
    expect(result.context.historyInput).toContain("31.2");
  });
});

describe("calculator Machine scenario 2: adding two percentages together", () => {
  const machine = interpret(calMachine);
  machine.start();
  test("given starting state, when entering 100, it should add 100. in history", () => {
    const result = machine.send({ type: "NUMBER", key: 100 });
    expect(result.context.historyInput).toEqual("100.");
  });
  test("given number 100, when entering percentage %, it should compute the percentage and add it in history", () => {
    const result = machine.send({ type: "PERCENTAGE" });
    expect(result.context.historyInput).toEqual("1");
    expect(result.context.display).toEqual("1");
  });
  test("given number 1, when entering operator +, it should add it in history", () => {
    const result = machine.send({ type: "OPERATOR", operator: "+" });
    expect(result.context.historyInput).toEqual("1 + ");
  });
  test("given operation 1 +, when entering 100, it should add 100. in history", () => {
    const result = machine.send({ type: "NUMBER", key: 100 });
    expect(result.context.historyInput).toEqual("1 + 100.");
  });
  test("given operation 1 + 100., when entering percentage %, it should compute the percentage correctly", () => {
    const result = machine.send({ type: "PERCENTAGE" });
    expect(result.context.historyInput).toEqual("2");
  });
});

describe("calculator Machine scenario 3: operation with multiple operators 1 - 1 + 2 / 2", () => {
  const machine = interpret(calMachine);
  machine.start();
  machine.send({ type: "NUMBER", key: 1 });
  machine.send({ type: "OPERATOR", operator: "-" });
  machine.send({ type: "NUMBER", key: 1 });
  machine.send({ type: "OPERATOR", operator: "+" });
  machine.send({ type: "NUMBER", key: 2 });
  machine.send({ type: "OPERATOR", operator: "/" });
  machine.send({ type: "NUMBER", key: 2 });
  const result = machine.send({ type: "EQUALS" });
  expect(result.context.historyInput).toEqual("1.");
  expect(result.context.display).toEqual("1.");
});
