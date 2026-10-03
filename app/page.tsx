'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '../lib/supabase/client';

import AuthPanel from './AuthPanel';


type ClinicalCase = {
  id: number;
  slug: string;
  title: string;
  specialty: string;
  difficulty: string;
  description: string | null;

  questions?: {
    id: number;
  }[];
};


export default function HomePage() {
  const router = useRouter();

  const [cases, setCases] =
    useState<ClinicalCase[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  useEffect(() => {
    async function loadCases() {
      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from('clinical_cases')
          .select(`
            id,
            slug,
            title,
            specialty,
            difficulty,
            description,
            questions (
              id
            )
          `)
          .order(
            'created_at',
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(error);

        setError(
          'Impossible de charger les cas cliniques.'
        );

        setLoading(false);

        return;
      }

      setCases(
        (data ?? []) as ClinicalCase[]
      );

      setLoading(false);
    }

    loadCases();
  }, []);


  return (
    <main className="shell">

      <header>

        <div className="brand">

          <span className="mark">
            AR
          </span>

          <div>
            <strong>
              AR-QUIZ
            </strong>

            <small>
              Cas cliniques interactifs
            </small>
          </div>

        </div>

      </header>


      <AuthPanel />


      <section
        className="hero"
        style={{
          marginTop: '2rem',
        }}
      >

        <span className="eyebrow">
          ENTRAÎNEMENT CLINIQUE
        </span>

        <h1>
          Cas cliniques interactifs
        </h1>

        <p>
          Testez vos connaissances à travers
          des situations cliniques progressives.
        </p>

      </section>


      {loading && (

        <section
          className="result"
          style={{
            marginTop: '2rem',
          }}
        >
          <p>
            Chargement des cas…
          </p>
        </section>

      )}


      {error && (

        <section
          className="result"
          style={{
            marginTop: '2rem',
          }}
        >
          <p>
            {error}
          </p>
        </section>

      )}


      {!loading &&
        !error &&
        cases.length === 0 && (

        <section
          className="result"
          style={{
            marginTop: '2rem',
          }}
        >
          <h2>
            Aucun cas disponible
          </h2>

          <p>
            Les prochains cas cliniques apparaîtront ici.
          </p>
        </section>

      )}


      {!loading &&
        cases.length > 0 && (

        <section
          style={{
            display: 'grid',
            gap: '1.25rem',
            marginTop: '2rem',
            marginBottom: '4rem',
          }}
        >

          {cases.map(
            (clinicalCase) => (

              <article
                key={
                  clinicalCase.id
                }
                style={{
                  border:
                    '1px solid rgba(128,128,128,0.25)',
                  borderRadius:
                    '16px',
                  padding:
                    '1.5rem',
                  textAlign:
                    'left',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap:
                      'wrap',
                    marginBottom:
                      '0.75rem',
                  }}
                >

                  <span className="eyebrow">
                    {
                      clinicalCase.specialty
                    }
                  </span>

                  <span
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    {
                      clinicalCase.difficulty
                    }
                  </span>

                </div>


                <h2>
                  {
                    clinicalCase.title
                  }
                </h2>


                {clinicalCase.description && (

                  <p>
                    {
                      clinicalCase.description
                    }
                  </p>

                )}


                <p
                  style={{
                    opacity: 0.7,
                  }}
                >
                  {
                    clinicalCase.questions
                      ?.length ?? 0
                  }{' '}
                  question
                  {
                    (
                      clinicalCase.questions
                        ?.length ??
                      0
                    ) > 1
                      ? 's'
                      : ''
                  }
                </p>


                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/cas/${clinicalCase.slug}`
                    )
                  }
                >
                  Commencer le cas →
                </button>

              </article>

            )
          )}

        </section>

      )}

    </main>
  );
}
