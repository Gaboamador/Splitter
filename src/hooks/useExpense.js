import { useEffect, useState } from 'react';
import { subscribeToExpense } from '@/services/firebase/expenseService';

export function useExpense(groupId, expenseId) {
  const [expense, setExpense] = useState(null);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [expenseError, setExpenseError] = useState('');

  useEffect(() => {
    if (!groupId || !expenseId) {
      setExpense(null);
      setExpenseLoading(false);
      setExpenseError('Gasto inválido.');
      return undefined;
    }

    setExpenseLoading(true);
    setExpenseError('');

    const unsubscribe = subscribeToExpense(
      groupId,
      expenseId,
      (nextExpense) => {
        setExpense(nextExpense);
        setExpenseError('');
        setExpenseLoading(false);
      },
      (error) => {
        console.error('No se pudo cargar el gasto:', error);
        setExpense(null);
        setExpenseError('No se pudo cargar el gasto.');
        setExpenseLoading(false);
      },
    );

    return unsubscribe;
  }, [groupId, expenseId]);

  return {
    expense,
    expenseLoading,
    expenseError,
    expenseExists: Boolean(expense),
  };
}