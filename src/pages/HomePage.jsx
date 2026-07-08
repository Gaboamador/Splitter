import { Link } from 'react-router-dom';
import { FiPlusCircle, FiUsers } from 'react-icons/fi';
import GroupCard from '@/components/GroupCard';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroups } from '@/hooks/useUserGroups';
import styles from './HomePage.module.scss';

function HomePage() {
  const { currentUser, userProfile } = useAuth();
  const { groups, groupsLoading, groupsError, hasGroups } = useUserGroups();

  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Usuario';

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Inicio</p>
          <h1>Hola, {displayName}</h1>
          <p>
            Acá aparecen tus grupos compartidos, los gastos cargados y el resumen de quién le
            debe a quién.
          </p>
        </div>

        <Link to="/grupos/nuevo" className={styles.primaryAction}>
          <FiPlusCircle aria-hidden="true" />
          Crear grupo
        </Link>
      </div>

      {groupsError ? <p className={styles.error}>{groupsError}</p> : null}

      {groupsLoading ? (
        <article className={styles.emptyState}>
          <h2>Cargando grupos...</h2>
        </article>
      ) : null}

      {!groupsLoading && !hasGroups ? (
        <article className={styles.emptyState}>
          <FiUsers aria-hidden="true" />
          <h2>Todavía no hay grupos</h2>
          <p>Creá tu primer grupo para empezar a cargar gastos compartidos.</p>
        </article>
      ) : null}

      {!groupsLoading && hasGroups ? (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default HomePage;