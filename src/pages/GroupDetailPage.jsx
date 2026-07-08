import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiLink,
  FiPlusCircle,
  FiSettings,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { TfiReceipt } from 'react-icons/tfi';
import AddMemberForm from '@/components/AddMemberForm';
import AddRegisteredUserForm from '@/components/AddRegisteredUserForm';
import ExpenseCard from '@/components/ExpenseCard';
import SettlementSummary from '@/components/SettlementSummary';
import {
  getGroupMembers,
  isUserGroupMember,
  linkManualMemberToRegisteredUser,
  removeManualMemberFromGroup,
} from '@/services/firebase/groupService';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroup';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import styles from './GroupDetailPage.module.scss';

const MOVEMENT_FILTERS = {
  all: 'all',
  expenses: 'expenses',
  payments: 'payments',
};

function getTransactionType(expense) {
  return expense.transactionType || 'expense';
}

function GroupDetailPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { currentUser } = useAuth();

  const { group, groupLoading, groupError, groupExists } = useGroup(groupId);
  const { expenses, expensesLoading, expensesError, hasExpenses } = useGroupExpenses(groupId);

  const [memberActionError, setMemberActionError] = useState('');
  const [deletingMemberId, setDeletingMemberId] = useState('');
  const [linkingMemberId, setLinkingMemberId] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [movementFilter, setMovementFilter] = useState(MOVEMENT_FILTERS.all);

  const members = getGroupMembers(group);
  const currentUserIsMember = isUserGroupMember(group, currentUser?.uid);

  const movementCounts = useMemo(() => {
    return expenses.reduce(
      (counts, expense) => {
        const transactionType = getTransactionType(expense);

        counts.all += 1;

        if (transactionType === 'payment') {
          counts.payments += 1;
        } else {
          counts.expenses += 1;
        }

        return counts;
      },
      {
        all: 0,
        expenses: 0,
        payments: 0,
      },
    );
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (movementFilter === MOVEMENT_FILTERS.all) {
      return expenses;
    }

    if (movementFilter === MOVEMENT_FILTERS.payments) {
      return expenses.filter((expense) => getTransactionType(expense) === 'payment');
    }

    return expenses.filter((expense) => getTransactionType(expense) !== 'payment');
  }, [expenses, movementFilter]);

  const hasFilteredExpenses = filteredExpenses.length > 0;

  const handleRemoveMember = async (member) => {
    const shouldRemove = window.confirm(
      `¿Eliminar a "${member.displayName || member.email || 'este miembro'}" del grupo?`,
    );

    if (!shouldRemove) {
      return;
    }

    setMemberActionError('');
    setDeletingMemberId(member.uid);

    try {
      await removeManualMemberFromGroup({
        group,
        memberId: member.uid,
        expenses,
      });
    } catch (error) {
      console.error(error);
      setMemberActionError(error.message || 'No se pudo eliminar el miembro.');
    } finally {
      setDeletingMemberId('');
    }
  };

  const handleOpenLinkMember = (member) => {
    setMemberActionError('');
    setLinkingMemberId(member.uid);
    setLinkEmail(member.email || '');
  };

  const handleCancelLinkMember = () => {
    setMemberActionError('');
    setLinkingMemberId('');
    setLinkEmail('');
  };

  const handleLinkMember = async (event) => {
    event.preventDefault();

    setMemberActionError('');
    setIsLinking(true);

    try {
      await linkManualMemberToRegisteredUser({
        group,
        manualMemberId: linkingMemberId,
        email: linkEmail,
        expenses,
      });

      setLinkingMemberId('');
      setLinkEmail('');
    } catch (error) {
      console.error(error);
      setMemberActionError(error.message || 'No se pudo vincular el miembro.');
    } finally {
      setIsLinking(false);
    }
  };

  if (groupLoading) {
    return (
      <section className={styles.page}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          <FiArrowLeft aria-hidden="true" />
          Volver
        </button>

        <article className={styles.statusCard}>
          <h1>Cargando grupo...</h1>
        </article>
      </section>
    );
  }

  if (groupError) {
    return (
      <section className={styles.page}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          <FiArrowLeft aria-hidden="true" />
          Volver
        </button>

        <article className={styles.statusCard}>
          <h1>Error</h1>
          <p>{groupError}</p>
        </article>
      </section>
    );
  }

  if (!groupExists || !currentUserIsMember) {
    return (
      <section className={styles.page}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          <FiArrowLeft aria-hidden="true" />
          Volver
        </button>

        <article className={styles.statusCard}>
          <h1>Grupo no disponible</h1>
          <p>El grupo no existe o no tenés permisos para verlo.</p>
        </article>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
        <FiArrowLeft aria-hidden="true" />
        Volver
      </button>

      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Grupo</p>
          <h1>{group.name}</h1>
          <p>{group.description || 'Grupo compartido de gastos.'}</p>
        </div>

        <div className={styles.heroActions}>
          <Link to={`/grupos/${group.id}/editar`} className={styles.secondaryAction}>
            <FiSettings aria-hidden="true" />
            Editar grupo
          </Link>

          <Link to={`/grupos/${group.id}/gastos/nuevo`} className={styles.primaryAction}>
            <FiPlusCircle aria-hidden="true" />
            Agregar gasto
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIcon}>
              <FiTrendingUp aria-hidden="true" />
            </div>

            <div>
              <h2>Resumen</h2>
              <p>Balances simplificados del grupo.</p>
            </div>
          </div>

          {expensesLoading ? (
            <div className={styles.placeholderBox}>
              <p>Cargando resumen...</p>
            </div>
          ) : (
            <SettlementSummary groupId={group.id} expenses={expenses} membersMap={group.membersMap} />
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIcon}>
              <FiUsers aria-hidden="true" />
            </div>

            <div>
              <h2>Miembros</h2>
              <p>
                {members.length === 1
                  ? '1 persona participa del grupo.'
                  : `${members.length} personas participan del grupo.`}
              </p>
            </div>
          </div>

          <AddRegisteredUserForm group={group} />

          <AddMemberForm groupId={group.id} />

          {memberActionError ? <p className={styles.error}>{memberActionError}</p> : null}

          <ul className={styles.membersList}>
            {members.map((member) => {
              const canDeleteMember = member.type === 'manual' && member.role !== 'owner';
              const canLinkMember = member.type === 'manual';

              return (
                <li key={member.uid} className={styles.memberItem}>
                  <div className={styles.avatar}>
                    {member.photoURL ? (
                      <img src={member.photoURL} alt="" />
                    ) : (
                      <span>{(member.displayName || member.email || 'U').charAt(0)}</span>
                    )}
                  </div>

                  <div className={styles.memberInfo}>
                    <strong>{member.displayName || member.email || 'Usuario'}</strong>
                    {member.email ? <span>{member.email}</span> : null}
                  </div>

                  <div className={styles.memberRight}>
                    <div className={styles.badges}>
                      {member.type === 'manual' ? (
                        <span className={styles.typeBadge}>Manual</span>
                      ) : null}

                      {member.role === 'owner' ? (
                        <span className={styles.roleBadge}>Admin</span>
                      ) : null}
                    </div>

                    <div className={styles.memberActions}>
                      {canLinkMember ? (
                        <button
                          type="button"
                          className={styles.memberLinkButton}
                          onClick={() => handleOpenLinkMember(member)}
                          disabled={expensesLoading || isLinking}
                          aria-label={`Vincular miembro ${member.displayName || member.email}`}
                        >
                          <FiLink aria-hidden="true" />
                        </button>
                      ) : null}

                      {canDeleteMember ? (
                        <button
                          type="button"
                          className={styles.memberDeleteButton}
                          onClick={() => handleRemoveMember(member)}
                          disabled={deletingMemberId === member.uid || expensesLoading || isLinking}
                          aria-label={`Eliminar miembro ${member.displayName || member.email}`}
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {linkingMemberId === member.uid ? (
                    <form className={styles.linkMemberForm} onSubmit={handleLinkMember}>
                      <label>
                        <span>Email del usuario registrado</span>
                        <input
                          type="email"
                          value={linkEmail}
                          onChange={(event) => setLinkEmail(event.target.value)}
                          placeholder="usuario@email.com"
                          required
                        />
                      </label>

                      <div className={styles.linkMemberActions}>
                        <button type="submit" disabled={isLinking}>
                          {isLinking ? 'Vinculando...' : 'Vincular'}
                        </button>

                        <button type="button" onClick={handleCancelLinkMember} disabled={isLinking}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelIcon}>
            <TfiReceipt aria-hidden="true" />
          </div>

          <div>
            <h2>Movimientos</h2>
            <p>Acá se listan los gastos y pagos registrados en este grupo.</p>
          </div>
        </div>

        <div className={styles.movementFilters} aria-label="Filtrar movimientos">
          <button
            type="button"
            className={movementFilter === MOVEMENT_FILTERS.all ? styles.activeFilter : ''}
            onClick={() => setMovementFilter(MOVEMENT_FILTERS.all)}
          >
            Todos
            <span>{movementCounts.all}</span>
          </button>

          <button
            type="button"
            className={movementFilter === MOVEMENT_FILTERS.expenses ? styles.activeFilter : ''}
            onClick={() => setMovementFilter(MOVEMENT_FILTERS.expenses)}
          >
            Gastos
            <span>{movementCounts.expenses}</span>
          </button>

          <button
            type="button"
            className={movementFilter === MOVEMENT_FILTERS.payments ? styles.activeFilter : ''}
            onClick={() => setMovementFilter(MOVEMENT_FILTERS.payments)}
          >
            Pagos
            <span>{movementCounts.payments}</span>
          </button>
        </div>

        {expensesError ? <p className={styles.error}>{expensesError}</p> : null}

        {expensesLoading ? (
          <div className={styles.placeholderBox}>
            <TfiReceipt aria-hidden="true" />
            <p>Cargando movimientos...</p>
          </div>
        ) : null}

        {!expensesLoading && !hasExpenses ? (
          <div className={styles.placeholderBox}>
            <TfiReceipt aria-hidden="true" />
            <p>Todavía no hay movimientos cargados.</p>
          </div>
        ) : null}

        {!expensesLoading && hasExpenses && !hasFilteredExpenses ? (
          <div className={styles.placeholderBox}>
            <TfiReceipt aria-hidden="true" />
            <p>No hay movimientos para este filtro.</p>
          </div>
        ) : null}

        {!expensesLoading && hasFilteredExpenses ? (
          <div className={styles.expensesList}>
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                groupId={group.id}
                membersMap={group.membersMap}
              />
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}

export default GroupDetailPage;