'use client';

import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '../../lib/supabase/client';


type OptionForm = {
  label: string;
  isCorrect: boolean;
};

type QuestionForm = {
  type: 'QCM' | 'QROC';

  time: number;

  title: string;

  stem: string;

  explanation: string;

  nextData: string;

  expected: string;

  options: OptionForm[];

  stemImageFile: File | null;
  stemImagePreview: string;

  explanationImageFile: File | null;
  explanationImagePreview: string;
};


function emptyQuestion(): QuestionForm {
  return {
    type: 'QCM',

    time: 30,

    title: '',

    stem: '',

    explanation: '',

    nextData: '',

    expected: '',

    options: [
      {
        label: '',
        isCorrect: false,
      },
      {
        label: '',
        isCorrect: false,
      },
      {
        label: '',
        isCorrect: false,
      },
      {
        label: '',
        isCorrect: false,
      },
    ],

    stemImageFile: null,
    stemImagePreview: '',

    explanationImageFile: null,
    explanationImagePreview: '',
  };
}


export default function AdminPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');

  const [specialty, setSpecialty] =
    useState('Réanimation');

  const [difficulty, setDifficulty] =
    useState('Intermédiaire');

  const [description, setDescription] =
    useState('');

  const [questions, setQuestions] =
    useState<QuestionForm[]>([
      emptyQuestion(),
    ]);

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [messageType, setMessageType] =
    useState<'success' | 'error' | ''>('');

  const [userEmail, setUserEmail] =
    useState('');

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);


  useEffect(() => {
    async function checkUser() {
      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setUserEmail('');
        setIsLoggedIn(false);

        return;
      }

      setUserEmail(
        user.email ?? ''
      );

      setIsLoggedIn(true);
    }

    checkUser();
  }, []);


  function updateQuestion(
    index: number,
    changes: Partial<QuestionForm>
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, i) =>
            i === index
              ? {
                  ...question,
                  ...changes,
                }
              : question
        )
    );
  }


  function addQuestion() {
    setQuestions(
      (current) => [
        ...current,
        emptyQuestion(),
      ]
    );
  }


  function removeQuestion(
    index: number
  ) {
    setQuestions(
      (current) =>
        current.filter(
          (_, i) =>
            i !== index
        )
    );
  }


  function updateOption(
    questionIndex: number,
    optionIndex: number,
    changes: Partial<OptionForm>
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, qIndex) => {
            if (
              qIndex !==
              questionIndex
            ) {
              return question;
            }

            return {
              ...question,

              options:
                question.options.map(
                  (
                    option,
                    oIndex
                  ) =>
                    oIndex ===
                    optionIndex
                      ? {
                          ...option,
                          ...changes,
                        }
                      : option
                ),
            };
          }
        )
    );
  }


  function addOption(
    questionIndex: number
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, index) => {
            if (
              index !==
              questionIndex
            ) {
              return question;
            }

            return {
              ...question,

              options: [
                ...question.options,

                {
                  label: '',
                  isCorrect: false,
                },
              ],
            };
          }
        )
    );
  }


  function removeOption(
    questionIndex: number,
    optionIndex: number
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, index) => {
            if (
              index !==
              questionIndex
            ) {
              return question;
            }

            return {
              ...question,

              options:
                question.options.filter(
                  (_, i) =>
                    i !== optionIndex
                ),
            };
          }
        )
    );
  }


  function validateImage(
    file: File
  ) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      throw new Error(
        'Formats acceptés : JPG, PNG, WEBP ou GIF.'
      );
    }

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      throw new Error(
        'L’image ne doit pas dépasser 5 Mo.'
      );
    }
  }


  function handleStemImage(
    questionIndex: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      validateImage(file);

      const previousPreview =
        questions[
          questionIndex
        ].stemImagePreview;

      if (previousPreview) {
        URL.revokeObjectURL(
          previousPreview
        );
      }

      const preview =
        URL.createObjectURL(file);

      updateQuestion(
        questionIndex,
        {
          stemImageFile:
            file,

          stemImagePreview:
            preview,
        }
      );

    } catch (error) {
      setMessageType('error');

      setMessage(
        error instanceof Error
          ? error.message
          : 'Image invalide.'
      );
    }
  }


  function handleExplanationImage(
    questionIndex: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      validateImage(file);

      const previousPreview =
        questions[
          questionIndex
        ].explanationImagePreview;

      if (previousPreview) {
        URL.revokeObjectURL(
          previousPreview
        );
      }

      const preview =
        URL.createObjectURL(file);

      updateQuestion(
        questionIndex,
        {
          explanationImageFile:
            file,

          explanationImagePreview:
            preview,
        }
      );

    } catch (error) {
      setMessageType('error');

      setMessage(
        error instanceof Error
          ? error.message
          : 'Image invalide.'
      );
    }
  }


  function removeStemImage(
    questionIndex: number
  ) {
    const preview =
      questions[
        questionIndex
      ].stemImagePreview;

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    updateQuestion(
      questionIndex,
      {
        stemImageFile: null,
        stemImagePreview: '',
      }
    );
  }


  function removeExplanationImage(
    questionIndex: number
  ) {
    const preview =
      questions[
        questionIndex
      ].explanationImagePreview;

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    updateQuestion(
      questionIndex,
      {
        explanationImageFile:
          null,

        explanationImagePreview:
          '',
      }
    );
  }


  async function uploadImage(
    file: File,
    folder: string
  ) {
    const supabase =
      createClient();

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg';

    const filename =
      `${crypto.randomUUID()}.${extension}`;

    const path =
      `${folder}/${filename}`;

    const {
      error,
    } =
      await supabase.storage
        .from(
          'case-images'
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              '3600',

            upsert: false,

            contentType:
              file.type,
          }
        );

    if (error) {
      throw new Error(
        `Erreur upload image : ${error.message}`
      );
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          'case-images'
        )
        .getPublicUrl(
          path
        );

    return data.publicUrl;
  }


  function validateCase() {
    if (
      !title.trim()
    ) {
      throw new Error(
        'Le titre du cas est obligatoire.'
      );
    }

    if (
      !specialty.trim()
    ) {
      throw new Error(
        'La spécialité est obligatoire.'
      );
    }

    if (
      questions.length === 0
    ) {
      throw new Error(
        'Le cas doit contenir au moins une question.'
      );
    }

    questions.forEach(
      (
        question,
        index
      ) => {

        if (
          !question.stem.trim()
        ) {
          throw new Error(
            `Question ${index + 1} : l’énoncé est obligatoire.`
          );
        }

        if (
          question.time <
            20 ||
          question.time >
            60
        ) {
          throw new Error(
            `Question ${index + 1} : le temps doit être compris entre 20 et 60 secondes.`
          );
        }

        if (
          question.type ===
          'QCM'
        ) {
          const validOptions =
            question.options.filter(
              (option) =>
                option.label.trim()
            );

          if (
            validOptions.length <
            2
          ) {
            throw new Error(
              `Question ${index + 1} : ajoutez au moins deux propositions.`
            );
          }

          const correctCount =
            validOptions.filter(
              (option) =>
                option.isCorrect
            ).length;

          if (
            correctCount ===
            0
          ) {
            throw new Error(
              `Question ${index + 1} : sélectionnez au moins une bonne réponse.`
            );
          }
        }

        if (
          question.type ===
          'QROC' &&
          !question.expected.trim()
        ) {
          throw new Error(
            `Question ${index + 1} : ajoutez au moins une réponse acceptée.`
          );
        }
      }
    );
  }


  async function publishCase() {
    setBusy(true);

    setMessage('');

    setMessageType('');

    try {
      validateCase();

      const supabase =
        createClient();

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          'Vous devez être connecté à AR-QUIZ pour publier le cas. Vous pouvez néanmoins remplir et tester le formulaire sans connexion.'
        );
      }

      const questionsForApi = [];

      for (
        let index = 0;
        index <
        questions.length;
        index++
      ) {
        const question =
          questions[index];

        let stemImageUrl =
          '';

        let explanationImageUrl =
          '';

        if (
          question.stemImageFile
        ) {
          stemImageUrl =
            await uploadImage(
              question.stemImageFile,
              `questions/${crypto.randomUUID()}/stem`
            );
        }

        if (
          question.explanationImageFile
        ) {
          explanationImageUrl =
            await uploadImage(
              question.explanationImageFile,
              `questions/${crypto.randomUUID()}/explanation`
            );
        }

        questionsForApi.push({
          type:
            question.type,

          time:
            question.time,

          title:
            question.title,

          stem:
            question.stem,

          explanation:
            question.explanation,

          nextData:
            question.nextData,

          expected:
            question.expected,

          options:
            question.options,

          stemImageUrl,

          explanationImageUrl,
        });
      }

      const response =
        await fetch(
          '/api/admin/cases',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                title,

                specialty,

                difficulty,

                description,

                questions:
                  questionsForApi,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            'Impossible de publier le cas.'
        );
      }

      setMessage(
        'Cas clinique publié avec succès.'
      );

      setMessageType(
        'success'
      );

      setTitle('');

      setSpecialty(
        'Réanimation'
      );

      setDifficulty(
        'Intermédiaire'
      );

      setDescription('');

      setQuestions([
        emptyQuestion(),
      ]);

    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la publication.'
      );

      setMessageType(
        'error'
      );
    }

    setBusy(false);
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
              Administration
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


      <section className="result">

        <span className="eyebrow">
          ADMINISTRATEUR
        </span>


        <h1>
          Nouveau cas clinique
        </h1>


        {isLoggedIn ? (
          <p>
            Connecté :{' '}
            <strong>
              {userEmail}
            </strong>
          </p>
        ) : (
          <div
            style={{
              marginTop:
                '1rem',
              marginBottom:
                '1rem',
              padding:
                '1rem',
              border:
                '1px solid rgba(128,128,128,0.3)',
              borderRadius:
                '10px',
            }}
          >
            Tu n’es pas connecté sur localhost.
            Tu peux construire le cas, mais il faudra te connecter avant de le publier.
          </div>
        )}


        <div
          style={{
            display: 'grid',
            gap: '1rem',
            width: '100%',
            marginTop: '2rem',
            textAlign: 'left',
          }}
        >

          <label>
            <strong>
              Titre du cas
            </strong>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Ex : Choc anaphylactique"
            />
          </label>


          <label>
            <strong>
              Spécialité
            </strong>

            <input
              value={specialty}
              onChange={(e) =>
                setSpecialty(
                  e.target.value
                )
              }
              placeholder="Ex : Réanimation"
            />
          </label>


          <label>
            <strong>
              Difficulté
            </strong>

            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(
                  e.target.value
                )
              }
            >
              <option>
                Débutant
              </option>

              <option>
                Intermédiaire
              </option>

              <option>
                Avancé
              </option>

              <option>
                Expert
              </option>
            </select>
          </label>


          <label>
            <strong>
              Description du cas
            </strong>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Description courte du cas clinique..."
            />
          </label>

        </div>


        {questions.map(
          (
            question,
            questionIndex
          ) => (

            <div
              key={
                questionIndex
              }
              style={{
                marginTop: '3rem',
                padding: '1.5rem',
                width: '100%',
                border:
                  '1px solid rgba(128,128,128,0.30)',
                borderRadius:
                  '16px',
                textAlign:
                  'left',
              }}
            >

              <h2>
                Question{' '}
                {questionIndex + 1}
              </h2>


              <label>
                <strong>
                  Type de question
                </strong>

                <select
                  value={
                    question.type
                  }
                  onChange={(e) =>
                    updateQuestion(
                      questionIndex,
                      {
                        type:
                          e.target.value as
                          | 'QCM'
                          | 'QROC',
                      }
                    )
                  }
                >
                  <option value="QCM">
                    QCM
                  </option>

                  <option value="QROC">
                    QROC
                  </option>
                </select>
              </label>


              <label>
                <strong>
                  Temps imparti
                </strong>

                <div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="5"
                    value={
                      question.time
                    }
                    onChange={(e) =>
                      updateQuestion(
                        questionIndex,
                        {
                          time:
                            Number(
                              e.target.value
                            ),
                        }
                      )
                    }
                  />

                  <strong
                    style={{
                      marginLeft:
                        '1rem',
                    }}
                  >
                    {
                      question.time
                    } s
                  </strong>
                </div>
              </label>


              <label>
                <strong>
                  Titre de la question
                </strong>

                <input
                  value={
                    question.title
                  }
                  onChange={(e) =>
                    updateQuestion(
                      questionIndex,
                      {
                        title:
                          e.target.value,
                      }
                    )
                  }
                  placeholder="Ex : Traitement initial"
                />
              </label>


              <label>
                <strong>
                  Énoncé
                </strong>

                <textarea
                  value={
                    question.stem
                  }
                  onChange={(e) =>
                    updateQuestion(
                      questionIndex,
                      {
                        stem:
                          e.target.value,
                      }
                    )
                  }
                  placeholder="Décrivez la situation clinique puis posez la question..."
                />
              </label>


              <div
                style={{
                  margin:
                    '1rem 0',
                }}
              >

                <strong>
                  Illustration de l’énoncé
                </strong>

                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(
                      event
                    ) =>
                      handleStemImage(
                        questionIndex,
                        event
                      )
                    }
                  />
                </div>


                {question.stemImagePreview && (
                  <div
                    style={{
                      marginTop:
                        '1rem',
                    }}
                  >

                    <img
                      src={
                        question.stemImagePreview
                      }
                      alt="Aperçu de l’énoncé"
                      style={{
                        maxWidth:
                          '100%',
                        maxHeight:
                          '350px',
                        borderRadius:
                          '10px',
                      }}
                    />

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          removeStemImage(
                            questionIndex
                          )
                        }
                      >
                        Supprimer l’image
                      </button>
                    </div>

                  </div>
                )}

              </div>


              {question.type ===
                'QCM' && (

                <div>

                  <h3>
                    Propositions
                  </h3>

                  <p>
                    Coche la ou les bonnes réponses.
                  </p>


                  {question.options.map(
                    (
                      option,
                      optionIndex
                    ) => (

                      <div
                        key={
                          optionIndex
                        }
                        style={{
                          display:
                            'flex',
                          gap:
                            '0.75rem',
                          alignItems:
                            'center',
                          marginBottom:
                            '0.75rem',
                        }}
                      >

                        <input
                          type="checkbox"
                          checked={
                            option.isCorrect
                          }
                          onChange={(e) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              {
                                isCorrect:
                                  e.target.checked,
                              }
                            )
                          }
                        />


                        <input
                          value={
                            option.label
                          }
                          onChange={(e) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              {
                                label:
                                  e.target.value,
                              }
                            )
                          }
                          placeholder={`Proposition ${
                            optionIndex +
                            1
                          }`}
                        />


                        {question.options.length >
                          2 && (

                          <button
                            type="button"
                            onClick={() =>
                              removeOption(
                                questionIndex,
                                optionIndex
                              )
                            }
                          >
                            ×
                          </button>

                        )}

                      </div>

                    )
                  )}


                  <button
                    type="button"
                    onClick={() =>
                      addOption(
                        questionIndex
                      )
                    }
                  >
                    + Ajouter une proposition
                  </button>

                </div>

              )}


              {question.type ===
                'QROC' && (

                <div>

                  <label>
                    <strong>
                      Réponses / mots-clés acceptés
                    </strong>

                    <input
                      value={
                        question.expected
                      }
                      onChange={(e) =>
                        updateQuestion(
                          questionIndex,
                          {
                            expected:
                              e.target.value,
                          }
                        )
                      }
                      placeholder="noradrénaline, noradrenaline"
                    />
                  </label>

                  <small>
                    Sépare les différentes réponses acceptées par des virgules.
                  </small>

                </div>

              )}


              <label>
                <strong>
                  Correction / explication
                </strong>

                <textarea
                  value={
                    question.explanation
                  }
                  onChange={(e) =>
                    updateQuestion(
                      questionIndex,
                      {
                        explanation:
                          e.target.value,
                      }
                    )
                  }
                  placeholder="Explication détaillée de la correction..."
                />
              </label>


              <div
                style={{
                  margin:
                    '1rem 0',
                }}
              >

                <strong>
                  Illustration de la correction
                </strong>

                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(
                      event
                    ) =>
                      handleExplanationImage(
                        questionIndex,
                        event
                      )
                    }
                  />
                </div>


                {question.explanationImagePreview && (
                  <div
                    style={{
                      marginTop:
                        '1rem',
                    }}
                  >

                    <img
                      src={
                        question.explanationImagePreview
                      }
                      alt="Aperçu de la correction"
                      style={{
                        maxWidth:
                          '100%',
                        maxHeight:
                          '350px',
                        borderRadius:
                          '10px',
                      }}
                    />


                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          removeExplanationImage(
                            questionIndex
                          )
                        }
                      >
                        Supprimer l’image
                      </button>
                    </div>

                  </div>
                )}

              </div>


              <label>
                <strong>
                  Évolution clinique après cette question
                </strong>

                <textarea
                  value={
                    question.nextData
                  }
                  onChange={(e) =>
                    updateQuestion(
                      questionIndex,
                      {
                        nextData:
                          e.target.value,
                      }
                    )
                  }
                  placeholder="Ex : Après remplissage, la PAM reste à 55 mmHg..."
                />
              </label>


              {questions.length >
                1 && (

                <button
                  type="button"
                  onClick={() =>
                    removeQuestion(
                      questionIndex
                    )
                  }
                  style={{
                    marginTop:
                      '1rem',
                  }}
                >
                  Supprimer cette question
                </button>

              )}

            </div>

          )
        )}


        <button
          type="button"
          onClick={
            addQuestion
          }
          style={{
            marginTop:
              '2rem',
          }}
        >
          + Ajouter une question
        </button>


        <div
          style={{
            marginTop:
              '3rem',
          }}
        >

          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              publishCase
            }
          >

            {busy
              ? 'Publication en cours…'
              : 'Publier le cas clinique'}

          </button>

        </div>


        {message && (
          <div
            style={{
              marginTop:
                '1.5rem',

              padding:
                '1rem',

              borderRadius:
                '10px',

              border:
                messageType ===
                'success'
                  ? '1px solid #3a8'
                  : '1px solid #c55',
            }}
          >
            {message}
          </div>
        )}

      </section>

    </main>
  );
}