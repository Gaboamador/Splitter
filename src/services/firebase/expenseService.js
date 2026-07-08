import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { splitAmountEqually } from '@/utils/moneyUtils';

export function getExpensesCollectionRef(groupId) {
  return collection(db, 'groups', groupId, 'expenses');
}

export function getExpenseRef(groupId, expenseId) {
  return doc(db, 'groups', groupId, 'expenses', expenseId);
}

function validateExpensePayload({ groupId, description, totalAmountCents, paidBy, participantIds }) {
  const cleanDescription = description.trim();

  if (!groupId) {
    throw new Error('Grupo inválido.');
  }

  if (!cleanDescription) {
    throw new Error('La descripción es obligatoria.');
  }

  if (!Number.isFinite(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error('El monto debe ser mayor a cero.');
  }

  if (!paidBy) {
    throw new Error('Tenés que elegir quién pagó.');
  }

  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new Error('Tenés que elegir al menos un participante.');
  }

  return cleanDescription;
}

function getMemberName(membersMap, memberId) {
  return membersMap?.[memberId]?.displayName || membersMap?.[memberId]?.email || 'Usuario';
}

export async function createExpense({
  groupId,
  description,
  totalAmountCents,
  paidBy,
  participantIds,
  membersMap,
  createdBy,
}) {
  const cleanDescription = validateExpensePayload({
    groupId,
    description,
    totalAmountCents,
    paidBy,
    participantIds,
  });

  const sharesMap = splitAmountEqually(totalAmountCents, participantIds);

  const expensePayload = {
    transactionType: 'expense',

    description: cleanDescription,
    totalAmountCents,
    currency: 'ARS',

    paidBy,
    paidByName: getMemberName(membersMap, paidBy),

    splitType: 'equal',
    participantIds,
    sharesMap,

    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(getExpensesCollectionRef(groupId), expensePayload);

  return {
    id: docRef.id,
    ...expensePayload,
  };
}

export async function updateExpense({
  groupId,
  expenseId,
  description,
  totalAmountCents,
  paidBy,
  participantIds,
  membersMap,
}) {
  const cleanDescription = validateExpensePayload({
    groupId,
    description,
    totalAmountCents,
    paidBy,
    participantIds,
  });

  if (!expenseId) {
    throw new Error('Gasto inválido.');
  }

  const sharesMap = splitAmountEqually(totalAmountCents, participantIds);

  await updateDoc(getExpenseRef(groupId, expenseId), {
    transactionType: 'expense',

    description: cleanDescription,
    totalAmountCents,
    currency: 'ARS',

    paidBy,
    paidByName: getMemberName(membersMap, paidBy),

    splitType: 'equal',
    participantIds,
    sharesMap,

    updatedAt: serverTimestamp(),
  });
}

export async function createPayment({
  groupId,
  fromId,
  toId,
  totalAmountCents,
  membersMap,
  createdBy,
}) {
  if (!groupId) {
    throw new Error('Grupo inválido.');
  }

  if (!fromId) {
    throw new Error('Tenés que elegir quién paga.');
  }

  if (!toId) {
    throw new Error('Tenés que elegir quién recibe.');
  }

  if (fromId === toId) {
    throw new Error('Quien paga y quien recibe no pueden ser la misma persona.');
  }

  if (!Number.isFinite(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error('El monto debe ser mayor a cero.');
  }

  const fromName = getMemberName(membersMap, fromId);
  const toName = getMemberName(membersMap, toId);

  const paymentPayload = {
    transactionType: 'payment',

    description: `Pago de ${fromName} a ${toName}`,
    totalAmountCents,
    currency: 'ARS',

    fromId,
    fromName,
    toId,
    toName,

    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(getExpensesCollectionRef(groupId), paymentPayload);

  return {
    id: docRef.id,
    ...paymentPayload,
  };
}

export async function deleteExpense({ groupId, expenseId }) {
  if (!groupId || !expenseId) {
    throw new Error('Movimiento inválido.');
  }

  await deleteDoc(getExpenseRef(groupId, expenseId));
}

export function subscribeToExpense(groupId, expenseId, callback, errorCallback) {
  if (!groupId || !expenseId) {
    return () => {};
  }

  return onSnapshot(
    getExpenseRef(groupId, expenseId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    errorCallback,
  );
}

export function subscribeToGroupExpenses(groupId, callback, errorCallback) {
  if (!groupId) {
    return () => {};
  }

  const expensesQuery = query(getExpensesCollectionRef(groupId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    expensesQuery,
    (snapshot) => {
      const expenses = snapshot.docs.map((expenseDoc) => ({
        id: expenseDoc.id,
        ...expenseDoc.data(),
      }));

      callback(expenses);
    },
    errorCallback,
  );
}