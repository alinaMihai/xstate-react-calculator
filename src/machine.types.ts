export type Context = {
  display: string;
  operand1?: string;
  operand2?: string;
  operator?: string;
  historyInput?: string;
};

export interface CalStateSchema {
  states: {
    start: {};
    operand1: {
      states: {
        zero: {};
        before_decimal_point: {};
        after_decimal_point: {};
      };
    };
    negative_number: {};
    operator_entered: {};
    operand2: {
      states: {
        zero: {};
        before_decimal_point: {};
        after_decimal_point: {};
      };
    };
    negative_number_2: {};
    result: {};
    alert: {};
  };
}


export type EventId = "NUMBER" | "OPERATOR" | "TOGGLE_SIGN" | "PERCENTAGE" | "CLEAR_ENTRY"| "DECIMAL_POINT"| "CLEAR_EVERYTHING"| "EQUALS";
export interface CalEvent  {
  type: EventId;
  operator?: string,
  key?: number
}