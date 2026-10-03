'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

type Attempt = {
  id: number;
  score: number;
  total: number;
  created_at: string;
  clinical_cases: {
    title: string;
    specialty: string;
  }[];
};

export default function ComptePage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();

      /*
       * 1. Vérifier quel utilisateur est connecté
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/');
        return;
      }

      setEmail(user.email ?? '');

      /*
       * 2. Charger uniquement les tentatives
       * de cet utilisateur
       */
      const { data, error } = await supabase
        .from('attempts')
        .select(`
          id,
          score,
          total,
          created_at,
          clinical_cases (
            title,
            specialty
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        setErrorMessage(
          'Impossible de charger votre historique pour le moment.'
        );
      } else {
        setAttempts((data ?? []) as Attempt[]);
      }

      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push('/');
  }

  /*
   * Écran de chargement
   */
  if (loading) {
    return (
      <main className="shell">
        <section className="result">
          <span className="eyebrow">MON COMPTE</span>
          <h1>Chargement…</h1>
        </section>
      </main>
    );
  }

  /*
   * Calcul de quelques statistiques
   */
  const numberOfAttempts = attempts.length;

  const bestAttempt =
    attempts.length > 0
      ? attempts.reduce((best, attempt) => {
          const currentRatio = attempt.score / attempt.total;
          const bestRatio = best.score / best.total;

          return currentRatio > bestRatio ? attempt : best;
        })
      : null;

  return (
    <main className="shell">
      <header>
        <div className="brand">
          <span className="mark">AR</span>

          <div>
            <strong>AR-QUIZ</strong>
            <small>Mon compte</small>
          </div>
        </div>

        <button onClick={() => router.push('/')}>
          ← Accueil
        </button>
      </header>

      <section className="result">
        <span className="eyebrow">MON COMPTE</span>

        <h1>Votre espace personnel</h1>

        <p>
          Connecté avec <strong>{email}</strong>
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
            marginBottom: '2rem',
          }}
        >
          <div className="stat">
            <b>{numberOfAttempts}</b>
            <span>
              {numberOfAttempts > 1
                ? 'tentatives enregistrées'
                : 'tentative enregistrée'}
            </span>
          </div>

          <div className="stat">
            <b>
              {bestAttempt
                ? `${bestAttempt.score}/${bestAttempt.total}`
                : '—'}
            </b>
            <span>meilleur résultat</span>
          </div>
        </div>

        <h2>Historique des tentatives</h2>

        {errorMessage && <p>{errorMessage}</p>}

        {!errorMessage && attempts.length === 0 && (
          <p>
            Vous n'avez encore aucune tentative enregistrée.
          </p>
        )}

        {!errorMessage && attempts.length > 0 && (
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              marginTop: '1.5rem',
              width: '100%',
            }}
          >
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                style={{
                  border: '1px solid rgba(128,128,128,0.25)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>
                    {attempt.clinical_cases?.[0]?.title ??
                      'Cas clinique'}
                  </strong>

                  <div>
                    <small>
                      {attempt.clinical_cases?.[0]?.specialty ??
                        'Médecine'}
                    </small>
                  </div>

                  <div>
                    <small>
                      {new Date(
                        attempt.created_at
                      ).toLocaleString('fr-FR')}
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {attempt.score}/{attempt.total}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={logout}
          style={{ marginTop: '2rem' }}
        >
          Se déconnecter
        </button>
      </section>
    </main>
  );
}