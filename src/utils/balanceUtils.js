export function getMemberDisplayName(member) {
  return member?.displayName || member?.email || 'Usuario';
}

function ensureBalance(balancesMap, memberId, memberFallback) {
  if (!balancesMap[memberId]) {
    balancesMap[memberId] = {
      memberId,
      member: memberFallback || { uid: memberId, displayName: 'Usuario' },
      expensePaidCents: 0,
      owedCents: 0,
      settlementPaidCents: 0,
      settlementReceivedCents: 0,
      netCents: 0,
    };
  }

  return balancesMap[memberId];
}

export function calculateGroupBalances({ expenses = [], membersMap = {} }) {
  const balancesMap = {};

  Object.values(membersMap).forEach((member) => {
    balancesMap[member.uid] = {
      memberId: member.uid,
      member,
      expensePaidCents: 0,
      owedCents: 0,
      settlementPaidCents: 0,
      settlementReceivedCents: 0,
      netCents: 0,
    };
  });

  expenses.forEach((expense) => {
    const transactionType = expense.transactionType || 'expense';
    const totalAmountCents = Number(expense.totalAmountCents) || 0;

    if (transactionType === 'payment') {
      const fromId = expense.fromId;
      const toId = expense.toId;

      if (!fromId || !toId || totalAmountCents <= 0) {
        return;
      }

      const fromBalance = ensureBalance(
        balancesMap,
        fromId,
        membersMap[fromId] || { uid: fromId, displayName: expense.fromName || 'Usuario' },
      );

      const toBalance = ensureBalance(
        balancesMap,
        toId,
        membersMap[toId] || { uid: toId, displayName: expense.toName || 'Usuario' },
      );

      fromBalance.settlementPaidCents += totalAmountCents;
      toBalance.settlementReceivedCents += totalAmountCents;

      return;
    }

    const paidBy = expense.paidBy;

    if (paidBy) {
      const payerBalance = ensureBalance(
        balancesMap,
        paidBy,
        membersMap[paidBy] || { uid: paidBy, displayName: expense.paidByName || 'Usuario' },
      );

      payerBalance.expensePaidCents += totalAmountCents;
    }

    Object.entries(expense.sharesMap || {}).forEach(([memberId, shareCents]) => {
      const memberBalance = ensureBalance(
        balancesMap,
        memberId,
        membersMap[memberId] || { uid: memberId, displayName: 'Usuario' },
      );

      memberBalance.owedCents += Number(shareCents) || 0;
    });
  });

  Object.values(balancesMap).forEach((balance) => {
    balance.netCents =
      balance.expensePaidCents -
      balance.owedCents +
      balance.settlementPaidCents -
      balance.settlementReceivedCents;
  });

  return balancesMap;
}

export function simplifySettlements(balancesMap) {
  const creditors = [];
  const debtors = [];

  Object.values(balancesMap).forEach((balance) => {
    if (balance.netCents > 0) {
      creditors.push({
        memberId: balance.memberId,
        member: balance.member,
        amountCents: balance.netCents,
      });
    }

    if (balance.netCents < 0) {
      debtors.push({
        memberId: balance.memberId,
        member: balance.member,
        amountCents: Math.abs(balance.netCents),
      });
    }
  });

  creditors.sort((a, b) => b.amountCents - a.amountCents);
  debtors.sort((a, b) => b.amountCents - a.amountCents);

  const settlements = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amountCents = Math.min(debtor.amountCents, creditor.amountCents);

    if (amountCents > 0) {
      settlements.push({
        fromId: debtor.memberId,
        fromMember: debtor.member,
        toId: creditor.memberId,
        toMember: creditor.member,
        amountCents,
      });
    }

    debtor.amountCents -= amountCents;
    creditor.amountCents -= amountCents;

    if (debtor.amountCents === 0) {
      debtorIndex += 1;
    }

    if (creditor.amountCents === 0) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

export function getGroupBalanceSummary({ expenses = [], membersMap = {} }) {
  const balancesMap = calculateGroupBalances({ expenses, membersMap });
  const settlements = simplifySettlements(balancesMap);

  const balances = Object.values(balancesMap).sort((a, b) => {
    const absDiff = Math.abs(b.netCents) - Math.abs(a.netCents);

    if (absDiff !== 0) {
      return absDiff;
    }

    return getMemberDisplayName(a.member).localeCompare(getMemberDisplayName(b.member));
  });

  const totalSpentCents = expenses.reduce((total, expense) => {
    const transactionType = expense.transactionType || 'expense';

    if (transactionType !== 'expense') {
      return total;
    }

    return total + (Number(expense.totalAmountCents) || 0);
  }, 0);

  const totalPaymentsCents = expenses.reduce((total, expense) => {
    const transactionType = expense.transactionType || 'expense';

    if (transactionType !== 'payment') {
      return total;
    }

    return total + (Number(expense.totalAmountCents) || 0);
  }, 0);

  return {
    balances,
    balancesMap,
    settlements,
    totalSpentCents,
    totalPaymentsCents,
    isSettled: settlements.length === 0,
  };
}