import { useEffect, useState } from 'react';
import { subscribeToGroupExpenses } from '@/services/firebase/expenseService';

export function useGroupExpenses(groupId) {
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState('');

  useEffect(() => {
    if (!groupId) {
      setExpenses([]);
      setExpensesLoading(false);
      setExpensesError('Grupo inválido.');
      return undefined;
    }

    setExpensesLoading(true);
    setExpensesError('');

    const unsubscribe = subscribeToGroupExpenses(
      groupId,
      (nextExpenses) => {
        setExpenses(nextExpenses);
        setExpensesError('');
        setExpensesLoading(false);
      },
      (error) => {
        console.error('No se pudieron cargar los gastos:', error);
        setExpenses([]);
        setExpensesError('No se pudieron cargar los gastos.');
        setExpensesLoading(false);
      },
    );

    return unsubscribe;
  }, [groupId]);

  return {
    expenses,
    expensesLoading,
    expensesError,
    hasExpenses: expenses.length > 0,
  };
}