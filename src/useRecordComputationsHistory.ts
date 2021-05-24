import  {useEffect} from 'react';
let history = '';
let lastOperator = '';
let isLastNumberNegative = false;

export default function useRecordComputationsHistory(service) {
    useEffect(() => {
        const subscription = service.subscribe((state) => {
          // simple state logging
          console.log(state.event, state.value);
          if(state.event.type === 'NUMBER') {
            //todo handle number starting with zero
            if(!isLastNumberNegative) {
              history = history+state.event.key;
            } else {
              const lastOperatorIndex = history.lastIndexOf(lastOperator);
              history = history.slice(0,lastOperatorIndex+1)+" "+state.event.key;
              isLastNumberNegative = false;
            }
          } else if(state.event.type === 'DECIMAL_POINT' && history.lastIndexOf('.') !== history.length - 1) {
            history = history+'.'
          }
           else if(state.event.type === 'OPERATOR' && history.trim().lastIndexOf(state.event.operator) !== history.trim().length - 1) {
            history = history+" "+state.event.operator+ " ";
            lastOperator = state.event.operator;
           }
           else if(state.event.type === 'PERCENTAGE') {
            history = history+'%';
            lastOperator = '%';
           }
           else if(state.event.type === 'TOGGLE_SIGN' && (typeof state.value === 'string' && state.value.indexOf('negative_number') > -1)) {
            const lastOperatorIndex = !!lastOperator ? history.lastIndexOf(lastOperator) : 0;
            isLastNumberNegative = true;
            history = lastOperatorIndex ? history.slice(0,lastOperatorIndex+1)  +" "+ `(-${history.slice(lastOperatorIndex+1)})` : `(-${history.slice(0,history.length)})`
           }
           else if(state.event.type === 'TOGGLE_SIGN' && (typeof state.value === 'string' && state.value.indexOf('negative_number') === -1)) {
             isLastNumberNegative = false;
           }
           else if((state.event.type === 'EQUALS' && (typeof state.value === 'string' && state.value.indexOf('result') !== -1)) || state.event.type === 'CLEAR_EVERYTHING') {
             history = '';
             lastOperator = '';
             isLastNumberNegative = false;
           }
           else if(state.event.type === 'CLEAR_ENTRY' && !(typeof state.value === 'string' && state.value.indexOf('operator_entered') !== -1)) {
            const lastOperatorIndex = !!lastOperator ? history.lastIndexOf(lastOperator) : 0;
            history = !lastOperatorIndex ? '' : `${history.slice(0,lastOperatorIndex+1)}`   
            // todo: handle percentage case, it should clear the last percentage entry
           }
        });
      
        return subscription.unsubscribe;
      }, [service]); // note: service should never change
      return history;
}