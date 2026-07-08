import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiTrash2 } from 'react-icons/fi';
import {
  deleteEmptyGroup,
  isGroupOwner,
  isUserGroupMember,
  updateGroupDetails,
} from '@/services/firebase/groupService';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroup';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import styles from './EditGroupPage.module.scss';

function EditGroupPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const { currentUser } = useAuth();
  const { group, groupLoading, groupError, groupExists } = useGroup(groupId);
  const { expenses, expensesLoading } = useGroupExpenses(groupId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [formInitialized, setFormInitialized] = useState(false);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserIsMember = isUserGroupMember(group, currentUser?.uid);
  const currentUserIsOwner = isGroupOwner(group, currentUser?.uid);
  const canRenderForm = groupExists && currentUserIsMember && currentUserIsOwner;
  const canDeleteGroup = expenses.length === 0;

  useEffect(() => {
    if (!group || formInitialized) {
      return;
    }

    setFormData({
      name: group.name || '',
      description: group.description || '',
    });

    setFormInitialized(true);
  }, [group, formInitialized]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      await updateGroupDetails({
        groupId,
        name: formData.name,
        description: formData.description,
      });

      navigate(`/grupos/${groupId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo editar el grupo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleteError('');
    setIsDeleting(true);

    try {
      const deleted = await deleteEmptyGroup({
        group,
        expenses,
      });

      if (deleted) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'No se pudo borrar el grupo.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (groupLoading || expensesLoading) {
    return (
      <section className={styles.page}>
        <article className={styles.statusCard}>
          <h1>Cargando grupo...</h1>
        </article>
      </section>
    );
  }

  if (groupError || !canRenderForm) {
    return (
      <section className={styles.page}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          <FiArrowLeft aria-hidden="true" />
          Volver
        </button>

        <article className={styles.statusCard}>
          <h1>No se puede editar el grupo</h1>
          <p>
            {groupError ||
              'El grupo no existe, no tenés permisos para verlo o no sos administrador.'}
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <button type="button" className={styles.backButton} onClick={() => navigate(`/grupos/${groupId}`)}>
        <FiArrowLeft aria-hidden="true" />
        Volver al grupo
      </button>

      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Editar grupo</p>
          <h1>{group.name}</h1>
          <p>Cambiá el nombre o la descripción del grupo.</p>
        </div>

        <label className={styles.field}>
          <span>Nombre del grupo</span>
          <input
            type="text"
            name="name"
            placeholder="Ej: Viaje Bariloche"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Descripción opcional</span>
          <textarea
            name="description"
            placeholder="Ej: Gastos compartidos del viaje"
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          <FiCheck aria-hidden="true" />
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <section className={styles.dangerCard}>
        <div>
          <p className={styles.dangerEyebrow}>Zona peligrosa</p>
          <h2>Borrar grupo</h2>

          {canDeleteGroup ? (
            <p>
              Este grupo no tiene movimientos. Podés borrarlo definitivamente si ya no lo necesitás.
            </p>
          ) : (
            <p>
              Este grupo tiene movimientos cargados. Para evitar perder historial, sólo se puede
              borrar si está vacío.
            </p>
          )}
        </div>

        {deleteError ? <p className={styles.error}>{deleteError}</p> : null}

        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDeleteGroup}
          disabled={!canDeleteGroup || isDeleting}
        >
          <FiTrash2 aria-hidden="true" />
          {isDeleting ? 'Borrando...' : 'Borrar grupo'}
        </button>
      </section>
    </section>
  );
}

export default EditGroupPage;