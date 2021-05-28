import {S} from './machine.constants';
export type Context = {
  display: string;
  operand1?: string;
  operand2?: string;
  operator?: string;
  historyInput?: string;
};

export interface CalStateSchema {
  states: {
    [S.start]: {};
    [S.operand1]: {
      states: {
        [S.zero]: {};
        [S.before_decimal_point]: {};
        [S.after_decimal_point]: {};
      };
    };
    [S.negative_number]: {};
    [S.operator_entered]: {};
    [S.operand2]: {
      states: {
        [S.zero]: {};
        [S.before_decimal_point]: {};
        [S.after_decimal_point]: {};
      };
    };
    [S.negative_number_2]: {};
    [S.result]: {};
    [S.alert]: {};
  };
}


export type EventId = "NUMBER" | "OPERATOR" | "TOGGLE_SIGN" | "PERCENTAGE" | "CLEAR_ENTRY"| "DECIMAL_POINT"| "CLEAR_EVERYTHING"| "EQUALS";
export interface CalEvent  {
  type: EventId;
  operator?: string,
  key?: number
}