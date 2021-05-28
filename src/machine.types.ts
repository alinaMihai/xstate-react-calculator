import { S, E } from "./machine.constants";
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

export type EventId =
  | E.NUMBER
  | E.OPERATOR
  | E.TOGGLE_SIGN
  | E.PERCENTAGE
  | E.CLEAR_ENTRY
  | E.DECIMAL_POINT
  | E.CLEAR_EVERYTHING
  | E.EQUALS;
export interface CalEvent {
  type: EventId;
  operator?: string;
  key?: number;
}
