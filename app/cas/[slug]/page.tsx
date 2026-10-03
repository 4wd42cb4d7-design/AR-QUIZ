'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { createClient } from '../../../lib/supabase/client';


type Option = {
  id: number;
  label: string;
  isCorrect: boolean;
};


type Question = {
  id: number;

  type: 'QCM' | 'QROC';

  time: number;

  title: string;

  stem: string;

  explanation: string;

  nextData: string;

  expectedKeywords: string[];

  stemImageUrl: string | null;

  explanationImageUrl: string | null;

  options: Option[];
};


type ClinicalCase = {
  id: number;
  slug: string;
  title: string;
  specialty: string;
  difficulty: string;
  description: string | null;
};


export default function ClinicalCasePage() {
  const params =
    useParams();

  const router =
    useRouter();

  const slug =
    Array.isArray(
      params.slug
    )
      ? params.slug[0]
      : params.slug;


  const [clinicalCase, setClinicalCase] =
    useState<ClinicalCase | null>(
      null
    );

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');


  const [userId, setUserId] =
    useState<string | null>(
      null
    );


  const [started, setStarted] =
    useState(false);

  const [idx, setIdx] =
    useState(0);

  const [remaining, setRemaining] =
    useState(0);

  const [selected, setSelected] =
    useState<number[]>([]);

  const [answer, setAnswer] =
    useState('');

  const [feedback, setFeedback] =
    useState<
      'correct' |
      'incorrect' |
      'timeout' |
      null
    >(null);

  const [score, setScore] =
    useState(0);

  const [finished, setFinished] =
    useState(false);

  const [saving, setSaving] =
    useState(false);


  const current =
    questions[idx];


  /*
   * CHARGEMENT DU CAS
   */
  useEffect(() => {
    if (!slug) {
      return;
    }


    async function loadCase() {
      const supabase =
        createClient();


      /*
       * Cas
       */
      const {
        data: caseData,
        error: caseError,
      } =
        await supabase
          .from(
            'clinical_cases'
          )
          .select(`
            id,
            slug,
            title,
            specialty,
            difficulty,
            description
          `)
          .eq(
            'slug',
            slug
          )
          .maybeSingle();


      if (
        caseError ||
        !caseData
      ) {
        console.error(
          caseError
        );

        setLoadError(
          'Ce cas clinique est introuvable.'
        );

        setLoading(false);

        return;
      }


      setClinicalCase(
        caseData
      );


      /*
       * Questions
       */
      const {
        data: questionData,
        error: questionError,
      } =
        await supabase
          .from(
            'questions'
          )
          .select(`
            id,
            position,
            type,
            time_limit_seconds,
            title,
            stem,
            explanation,
            next_data,
            expected_keywords,
            stem_image_url,
            explanation_image_url
          `)
          .eq(
            'case_id',
            caseData.id
          )
          .order(
            'position',
            {
              ascending: true,
            }
          );


      if (questionError) {
        console.error(
          questionError
        );

        setLoadError(
          'Impossible de charger les questions.'
        );

        setLoading(false);

        return;
      }


      const ids =
        (questionData ?? [])
          .map(
            (question) =>
              question.id
          );


      let optionData: any[] =
        [];


      if (
        ids.length >
        0
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'question_options'
            )
            .select(`
              id,
              question_id,
              position,
              label,
              is_correct
            `)
            .in(
              'question_id',
              ids
            )
            .order(
              'position',
              {
                ascending: true,
              }
            );


        if (error) {
          console.error(
            error
          );

          setLoadError(
            'Impossible de charger les réponses.'
          );

          setLoading(false);

          return;
        }


        optionData =
          data ?? [];
      }


      const transformed:
        Question[] =
        (questionData ?? [])
          .map(
            (question) => ({
              id:
                question.id,

              type:
                question.type as
                  | 'QCM'
                  | 'QROC',

              time:
                question.time_limit_seconds,

              title:
                question.title ??
                '',

              stem:
                question.stem,

              explanation:
                question.explanation ??
                '',

              nextData:
                question.next_data ??
                '',

              expectedKeywords:
                question.expected_keywords ??
                [],

              stemImageUrl:
                question.stem_image_url ??
                null,

              explanationImageUrl:
                question.explanation_image_url ??
                null,

              options:
                optionData
                  .filter(
                    (option) =>
                      option.question_id ===
                      question.id
                  )
                  .map(
                    (option) => ({
                      id:
                        option.id,

                      label:
                        option.label,

                      isCorrect:
                        option.is_correct,
                    })
                  ),
            })
          );


      setQuestions(
        transformed
      );


      setLoading(
        false
      );
    }


    loadCase();

  }, [slug]);


  /*
   * UTILISATEUR
   */
  useEffect(() => {
    const supabase =
      createClient();


    supabase.auth
      .getUser()
      .then(
        ({
          data: {
            user,
          },
        }) => {
          setUserId(
            user?.id ??
              null
          );
        }
      );


    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            session
          ) => {
            setUserId(
              session?.user
                .id ??
                null
            );
          }
        );


    return () => {
      subscription.unsubscribe();
    };

  }, []);


  /*
   * TIMER
   */
  useEffect(() => {
    if (
      !started ||
      finished ||
      feedback ||
      !current
    ) {
      return;
    }


    if (
      remaining <=
      0
    ) {
      setFeedback(
        'timeout'
      );

      return;
    }


    const timer =
      window.setInterval(
        () => {
          setRemaining(
            (value) =>
              value - 1
          );
        },
        1000
      );


    return () => {
      window.clearInterval(
        timer
      );
    };

  }, [
    started,
    finished,
    feedback,
    remaining,
    current,
  ]);


  /*
   * DÉMARRER
   */
  function startCase() {
    if (
      questions.length ===
      0
    ) {
      return;
    }


    setStarted(
      true
    );

    setIdx(
      0
    );

    setRemaining(
      questions[0].time
    );

    setSelected(
      []
    );

    setAnswer(
      ''
    );

    setFeedback(
      null
    );

    setScore(
      0
    );

    setFinished(
      false
    );
  }


  /*
   * NORMALISATION QROC
   */
  function normalize(
    value: string
  ) {
    return value
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .trim();
  }


  /*
   * CORRIGER
   */
  function validateAnswer() {
    if (
      !current ||
      feedback
    ) {
      return;
    }


    let correct =
      false;


    /*
     * QCM
     */
    if (
      current.type ===
      'QCM'
    ) {
      const expected =
        current.options
          .filter(
            (option) =>
              option.isCorrect
          )
          .map(
            (option) =>
              option.id
          )
          .sort();


      const given =
        [...selected]
          .sort();


      correct =
        expected.length ===
          given.length &&
        expected.every(
          (
            value,
            index
          ) =>
            value ===
            given[index]
        );
    }


    /*
     * QROC
     */
    if (
      current.type ===
      'QROC'
    ) {
      const normalizedAnswer =
        normalize(
          answer
        );


      correct =
        current.expectedKeywords
          .some(
            (keyword) =>
              normalizedAnswer.includes(
                normalize(
                  keyword
                )
              )
          );
    }


    if (correct) {
      setScore(
        (value) =>
          value + 1
      );

      setFeedback(
        'correct'
      );
    } else {
      setFeedback(
        'incorrect'
      );
    }
  }


  /*
   * SAUVEGARDER SCORE
   */
  async function saveAttempt(
    finalScore: number
  ) {
    if (
      !userId ||
      !clinicalCase
    ) {
      return;
    }


    setSaving(
      true
    );


    const supabase =
      createClient();


    const {
      error,
    } =
      await supabase
        .from(
          'attempts'
        )
        .insert({
          user_id:
            userId,

          case_id:
            clinicalCase.id,

          score:
            finalScore,

          total:
            questions.length,
        });


    if (error) {
      console.error(
        'Erreur sauvegarde score :',
        error
      );
    }


    setSaving(
      false
    );
  }


  /*
   * QUESTION SUIVANTE
   */
  async function nextQuestion() {
    if (
      idx >=
      questions.length -
        1
    ) {
      await saveAttempt(
        score
      );

      setFinished(
        true
      );

      return;
    }


    const nextIndex =
      idx + 1;


    setIdx(
      nextIndex
    );

    setRemaining(
      questions[
        nextIndex
      ].time
    );

    setSelected(
      []
    );

    setAnswer(
      ''
    );

    setFeedback(
      null
    );
  }


  /*
   * TEXTE RÉSULTAT
   */
  const percentage =
    useMemo(
      () => {
        if (
          questions.length ===
          0
        ) {
          return 0;
        }

        return Math.round(
          (
            score /
            questions.length
          ) *
            100
        );
      },
      [
        score,
        questions.length,
      ]
    );


  /*
   * CHARGEMENT
   */
  if (loading) {
    return (
      <main className="shell">

        <section className="result">
          <p>
            Chargement du cas clinique…
          </p>
        </section>

      </main>
    );
  }


  /*
   * ERREUR
   */
  if (
    loadError ||
    !clinicalCase
  ) {
    return (
      <main className="shell">

        <section className="result">

          <h1>
            Cas introuvable
          </h1>

          <p>
            {
              loadError
            }
          </p>

          <button
            onClick={() =>
              router.push(
                '/'
              )
            }
          >
            ← Retour aux cas
          </button>

        </section>

      </main>
    );
  }


  /*
   * ÉCRAN D'INTRODUCTION
   */
  if (!started) {
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
                {
                  clinicalCase.specialty
                }
              </small>
            </div>

          </div>


          <button
            onClick={() =>
              router.push(
                '/'
              )
            }
          >
            ← Cas cliniques
          </button>

        </header>


        <section className="hero">

          <span className="eyebrow">
            {
              clinicalCase.difficulty
            }
          </span>


          <h1>
            {
              clinicalCase.title
            }
          </h1>


          {clinicalCase.description && (

            <p>
              {
                clinicalCase.description
              }
            </p>

          )}


          <p>
            {
              questions.length
            }{' '}
            question
            {
              questions.length >
              1
                ? 's'
                : ''
            }
          </p>


          <button
            type="button"
            onClick={
              startCase
            }
          >
            Commencer
          </button>

        </section>

      </main>
    );
  }


  /*
   * RÉSULTATS
   */
  if (finished) {
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
                Résultat
              </small>
            </div>

          </div>

        </header>


        <section className="result">

          <span className="eyebrow">
            CAS TERMINÉ
          </span>


          <h1>
            {
              clinicalCase.title
            }
          </h1>


          <h2>
            {score}
            {' / '}
            {
              questions.length
            }
          </h2>


          <p>
            {percentage} %
          </p>


          {userId ? (

            <p>
              {saving
                ? 'Enregistrement du résultat…'
                : 'Résultat enregistré dans votre compte.'}
            </p>

          ) : (

            <p>
              Connectez-vous pour conserver vos résultats.
            </p>

          )}


          <div
            style={{
              display:
                'flex',
              gap:
                '1rem',
              flexWrap:
                'wrap',
              justifyContent:
                'center',
            }}
          >

            <button
              onClick={
                startCase
              }
            >
              Recommencer
            </button>


            <button
              onClick={() =>
                router.push(
                  '/'
                )
              }
            >
              Autres cas
            </button>

          </div>

        </section>

      </main>
    );
  }


  /*
   * QUESTION
   */
  if (!current) {
    return null;
  }


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
              {
                clinicalCase.title
              }
            </small>
          </div>

        </div>


        <div>
          Question{' '}
          {idx + 1}
          {' / '}
          {
            questions.length
          }
        </div>

      </header>


      <section className="result">

        <div
          style={{
            display:
              'flex',
            justifyContent:
              'space-between',
            gap:
              '1rem',
            alignItems:
              'center',
          }}
        >

          <span className="eyebrow">
            {
              current.type
            }
          </span>


          {!feedback && (

            <strong>
              {remaining} s
            </strong>

          )}

        </div>


        {current.title && (

          <h2>
            {
              current.title
            }
          </h2>

        )}


        <p
          style={{
            whiteSpace:
              'pre-wrap',
          }}
        >
          {
            current.stem
          }
        </p>


        {/* IMAGE DE L'ÉNONCÉ */}

        {current.stemImageUrl && (

          <img
            src={
              current.stemImageUrl
            }
            alt="Illustration de l’énoncé"
            style={{
              display:
                'block',
              width:
                '100%',
              maxHeight:
                '500px',
              objectFit:
                'contain',
              borderRadius:
                '12px',
              margin:
                '1.5rem auto',
            }}
          />

        )}


        {/* QCM */}

        {current.type ===
          'QCM' && (

          <div
            style={{
              display:
                'grid',
              gap:
                '0.75rem',
              marginTop:
                '1.5rem',
            }}
          >

            {current.options.map(
              (option) => {

                const checked =
                  selected.includes(
                    option.id
                  );


                return (

                  <label
                    key={
                      option.id
                    }
                    style={{
                      display:
                        'flex',
                      gap:
                        '0.75rem',
                      alignItems:
                        'center',
                      padding:
                        '1rem',
                      border:
                        '1px solid rgba(128,128,128,0.3)',
                      borderRadius:
                        '10px',
                      cursor:
                        feedback
                          ? 'default'
                          : 'pointer',
                    }}
                  >

                    <input
                      type="checkbox"
                      disabled={
                        Boolean(
                          feedback
                        )
                      }
                      checked={
                        checked
                      }
                      onChange={() => {

                        if (
                          feedback
                        ) {
                          return;
                        }


                        setSelected(
                          (currentSelection) =>
                            checked
                              ? currentSelection.filter(
                                  (
                                    value
                                  ) =>
                                    value !==
                                    option.id
                                )
                              : [
                                  ...currentSelection,
                                  option.id,
                                ]
                        );
                      }}
                    />


                    <span>
                      {
                        option.label
                      }
                    </span>

                  </label>

                );
              }
            )}

          </div>

        )}


        {/* QROC */}

        {current.type ===
          'QROC' && (

          <div
            style={{
              marginTop:
                '1.5rem',
            }}
          >

            <input
              type="text"
              disabled={
                Boolean(
                  feedback
                )
              }
              value={
                answer
              }
              onChange={(e) =>
                setAnswer(
                  e.target.value
                )
              }
              placeholder="Votre réponse..."
            />

          </div>

        )}


        {/* VALIDER */}

        {!feedback && (

          <button
            type="button"
            onClick={
              validateAnswer
            }
            style={{
              marginTop:
                '2rem',
            }}
          >
            Valider
          </button>

        )}


        {/* CORRECTION */}

        {feedback && (

          <div
            style={{
              marginTop:
                '2rem',
              padding:
                '1.5rem',
              border:
                '1px solid rgba(128,128,128,0.3)',
              borderRadius:
                '12px',
            }}
          >

            <h3>

              {feedback ===
              'correct'
                ? 'Bonne réponse'
                : feedback ===
                  'timeout'
                ? 'Temps écoulé'
                : 'Réponse incorrecte'}

            </h3>


            {current.explanation && (

              <p
                style={{
                  whiteSpace:
                    'pre-wrap',
                }}
              >
                {
                  current.explanation
                }
              </p>

            )}


            {/* IMAGE CORRECTION */}

            {current.explanationImageUrl && (

              <img
                src={
                  current.explanationImageUrl
                }
                alt="Illustration de la correction"
                style={{
                  display:
                    'block',
                  width:
                    '100%',
                  maxHeight:
                    '500px',
                  objectFit:
                    'contain',
                  borderRadius:
                    '12px',
                  margin:
                    '1.5rem auto',
                }}
              />

            )}


            {current.nextData && (

              <div
                style={{
                  marginTop:
                    '1.5rem',
                }}
              >

                <strong>
                  Évolution clinique
                </strong>

                <p
                  style={{
                    whiteSpace:
                      'pre-wrap',
                  }}
                >
                  {
                    current.nextData
                  }
                </p>

              </div>

            )}


            <button
              type="button"
              onClick={
                nextQuestion
              }
              style={{
                marginTop:
                  '1rem',
              }}
            >

              {idx ===
              questions.length -
                1
                ? 'Voir le résultat'
                : 'Question suivante →'}

            </button>

          </div>

        )}

      </section>

    </main>
  );
}