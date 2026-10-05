'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { createClient } from '../../../lib/supabase/client';


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


const audienceNames: Record<string, string> = {
  interne: 'INTERNE',
  iade: 'IADE',
  'ide-rea': 'IDE de Réa',
};


export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

  const audience =
    Array.isArray(params.audience)
      ? params.audience[0]
      : params.audience;

  const [cases, setCases] =
    useState<ClinicalCase[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  useEffect(() => {
    if (!audience) {
      return;
    }

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
          .eq('audience', audience)
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
  }, [audience]);


  const title =
    audienceNames[audience ?? ''] ??
    'Cas cliniques';


  return (
    <main className="shell">

      <header>

        <div className="brand">

          <span className="mark">
            M
          </span>

          <div>
            <strong>
              MARGUEZ
            </strong>

            <small>
              {title}
            </small>
          </div>

        </div>


        <button
          type="button"
          onClick={() =>
            router.push('/')
          }
        >
          ← Accueil
        </button>

      </header>


      <section className="hero">

        <span className="eyebrow">
          {title}
        </span>

        <h1>
          Cas cliniques
        </h1>

        <p>
          Choisissez un cas clinique pour commencer.
        </p>

      </section>


      {loading && (

        <section className="result">
          Chargement…
        </section>

      )}


      {error && (

        <section className="result">
          {error}
        </section>

      )}


      {!loading &&
        !error &&
        cases.length === 0 && (

        <section className="result">

          <h2>
            Aucun cas disponible
          </h2>

          <p>
            Les cas de cette section apparaîtront ici.
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
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'left',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >

                  <span className="eyebrow">
                    {clinicalCase.specialty}
                  </span>

                  <span
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    {clinicalCase.difficulty}
                  </span>

                </div>


                <h2>
                  {clinicalCase.title}
                </h2>


                {clinicalCase.description && (

                  <p>
                    {clinicalCase.description}
                  </p>

                )}


                <p
                  style={{
                    opacity: 0.65,
                  }}
                >
                  {clinicalCase.questions?.length ?? 0}
                  {' '}
                  question
                  {(clinicalCase.questions?.length ?? 0) > 1
                    ? 's'
                    : ''}
                </p>


                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/cas/${clinicalCase.slug}`
                    )
                  }
                >
                  Commencer →
                </button>

              </article>

            )
          )}

        </section>

      )}

    </main>
  );
}