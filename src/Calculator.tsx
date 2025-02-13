import React from 'react';
import { useMachine } from '@xstate/react';
import styled from 'styled-components';
import machine, { isOperator } from './machine';
import { CalEvent } from './machine.types';
import { E } from './machine.constants';

const Input = styled.textarea`
  font-size: 22px;
  color: #333;
  text-align: right;
  padding: 5px 13px;
  width: 100%;
  border: none;
  border-bottom: 1px solid gray;
  box-sizing: border-box;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
`;

const Button = styled.button`
  padding: 10px;
  font-size: 22px;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  outline: none;
  border-width: 5px !important;
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
  &:hover {
    opacity: 1;
  }
  &:active {
    background: #999;
    box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  &.clear-btn {
    background-color: #3572db;
  }
  &.operator {
    background-color: #2b1b06;
    border-color: #2b1b06;
  }
`;

const ExtraData = styled.div`
  margin-top: 8px;
  padding: 20px 16px;
  p,
  pre,
  code {
    text-align: left;
    margin: 0;
    padding: 0;
    margin-top: 12px;
  }
`;

const buttons = [
  'C',
  'CE',
  '+/-',
  '/',
  '7',
  '8',
  '9',
  'x',
  '4',
  '5',
  '6',
  '-',
  '1',
  '2',
  '3',
  '+',
  '0',
  '.',
  '%',
  '=',
];

function addButtonClasses(text) {
   const classes = [''];
   if(isOperator(text) || text === '=') {
     classes.push('operator')
   } 
   else if(text === 'C') {
     classes.push('clear-btn');
   }
   return classes.join(' ');
}

const Calculator = () => {
  const [state, sendMachine] = useMachine(machine, {devTools: true});
  
  function send(event: CalEvent) {
    console.log(event);

    sendMachine(event);
  }

  const handleButtonClick = (item:string) => () => {
    if (Number.isInteger(+item)) {
      send({ type: E.NUMBER, key: +item });
    } else if (isOperator(item)) {
      send({type: E.OPERATOR, operator: item });
    } else if (item === 'C') {
      send({ type: E.CLEAR_EVERYTHING });
    } else if (item === '.') {
      send({ type: E.DECIMAL_POINT });
    } else if (item === '%') {
      send({ type: E.PERCENTAGE });
    } else if (item === 'CE') {
      send({ type: E.CLEAR_ENTRY });
    } else if( item === '+/-') {
      send({ type: E.TOGGLE_SIGN});
    } 
    else {
      send({ type: E.EQUALS });
    }
  };

  return (
    <div
      style={{
        width: 300,
        height: 'auto',
        border: '1px solid rgba(0,0,0,0.05)',
        margin: '0 auto',
        marginTop: 16,
      }}
    >
      <div>
        <Input
          rows={3}
          cols={3}
          value={state.context.historyInput}
          disabled
          style={{
            width: '100%',
            textAlign: 'right',
            padding: '8px 20px',
            border: 'none',
            outline: 'none',
          }}
        />
      </div>
      <ButtonGrid
        style={{
          padding: '8px 20px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {buttons.map((btn, index) => (
          <Button
            className={addButtonClasses(btn)}
            type="button"
            key={index}
            onClick={handleButtonClick(btn)}
          >
            {btn}
          </Button>
        ))}
      </ButtonGrid>

      <ExtraData>
        <p className="mt-1">State:</p>
        <pre>
          <code>{JSON.stringify(state.value, null, 2)}</code>
        </pre>
        <p className="mt-1">Context:</p>
        <pre>
          <code>{JSON.stringify(state.context, null, 2)}</code>
        </pre>
      </ExtraData>
    </div>
  );
};

export default Calculator;
