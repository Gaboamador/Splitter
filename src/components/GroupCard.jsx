import { Link } from 'react-router-dom';
import { FiArrowRight, FiUsers } from 'react-icons/fi';
import styles from './GroupCard.module.scss';

function GroupCard({ group }) {
  const membersCount = group.memberIds?.length || 0;

  return (
    <article className={styles.card}>
      <div className={styles.iconBox}>
        <FiUsers aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <h2>{group.name}</h2>

        {group.description ? <p>{group.description}</p> : <p>Grupo compartido de gastos.</p>}

        <span className={styles.meta}>
          {membersCount === 1 ? '1 miembro' : `${membersCount} miembros`}
        </span>
      </div>

      <Link to={`/grupos/${group.id}`} className={styles.link}>
        Abrir
        <FiArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}

export default GroupCard;