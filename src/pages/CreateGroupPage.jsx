import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { createGroup } from '@/services/firebase/groupService';
import { useAuth } from '@/hooks/useAuth';
import styles from './CreateGroupPage.module.scss';

function CreateGroupPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedUserProfile = userProfile || {
    uid: currentUser?.uid,
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    photoURL: currentUser?.photoURL || '',
  };

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
      const group = await createGroup({
        name: formData.name,
        description: formData.description,
        userProfile: resolvedUserProfile,
      });

      navigate(`/grupos/${group.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo crear el grupo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
        <FiArrowLeft aria-hidden="true" />
        Volver
      </button>

      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Nuevo grupo</p>
          <h1>Crear grupo</h1>
          <p>
            Creá una base compartida para cargar gastos de una salida, viaje, casa o reunión.
          </p>
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
          {isSubmitting ? 'Creando...' : 'Crear grupo'}
        </button>
      </form>
    </section>
  );
}

export default CreateGroupPage;