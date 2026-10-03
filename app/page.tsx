'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import AuthPanel from './AuthPanel';

type Question = {
  id: number;
  type: 'QCM' | 'QROC';
  time: number;
  title: string;
  stem: string;
  options?: string[];
  correct?: number[];
  expected?: string[];
  explanation: string;
  nextData: string;
};
type UserState = {
  id: string;
  email?: string;
} | null;
export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState<UserState>(null);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] =
    useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  /*
   * CHARGEMENT DEPUIS SUPABASE
   */
  useEffect(() => {
    async function loadCase() {
      try {
        const supabase = createClient();

        // 1. Retrouver le cas clinique
        const { data: clinicalCase, error: caseError } = await supabase
          .from('clinical_cases')
          .select('id')
          .eq('slug', 'choc-septique-urinaire')
          .single();

        if (caseError) throw caseError;

        // 2. Charger les questions du cas
        const { data: questionRows, error: questionsError } = await supabase
          .from('questions')
          .select(
            `
            id,
            position,
            type,
            time_limit_seconds,
            title,
            stem,
            explanation,
            expected_keywords,
            next_data
          `
          )
          .eq('case_id', clinicalCase.id)
          .order('position');

        if (questionsError) throw questionsError;

        if (!questionRows || questionRows.length === 0) {
          throw new Error('Aucune question trouvée dans Supabase.');
        }

        /*
         * 3. Charger les propositions des QCM
         */
        const questionIds = questionRows.map((q) => q.id);

        const { data: optionRows, error: optionsError } = await supabase
          .from('question_options')
          .select(
            `
            id,
            question_id,
            position,
            label,
            is_correct
          `
          )
          .in('question_id', questionIds)
          .order('position');

        if (optionsError) throw optionsError;

        /*
         * 4. Transformer les données Supabase
         * dans le format utilisé par notre interface
         */
        const formattedQuestions: Question[] = questionRows.map((q) => {
          const optionsForQuestion =
            optionRows?.filter((option) => option.question_id === q.id) ?? [];

          return {
            id: q.id,
            type: q.type as 'QCM' | 'QROC',
            time: q.time_limit_seconds,
            title: q.title ?? `Question ${q.position}`,
            stem: q.stem,
            options:
              q.type === 'QCM'
                ? optionsForQuestion.map((option) => option.label)
                : undefined,
            correct:
              q.type === 'QCM'
                ? optionsForQuestion
                    .map((option, index) =>
                      option.is_correct ? index : null
                    )
                    .filter((index): index is number => index !== null)
                : undefined,
            expected:
              q.type === 'QROC'
                ? q.expected_keywords ?? []
                : undefined,
            explanation: q.explanation ?? '',
            nextData: q.next_data ?? '',
          };
        });

        setQuestions(formattedQuestions);
      } catch (error) {
        console.error(error);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le cas clinique.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, []);

  useEffect(() => {
  const supabase = createClient();

  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
      });
    } else {
      setUser(null);
    }
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
    } else {
      setUser(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);

  const q = questions[idx];

  const progress = useMemo(() => {
    if (!questions.length) return 0;

    return Math.round(
      ((idx + (feedback ? 1 : 0)) / questions.length) * 100
    );
  }, [idx, feedback, questions.length]);

  /*
   * CHRONOMÈTRE
   */
  useEffect(() => {
    if (!started || finished || feedback || !q) return;

    setRemaining(q.time);

    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          return 0;
        }

        return r - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [idx, started, finished, feedback, q]);

  useEffect(() => {
    if (
      started &&
      !finished &&
      !feedback &&
      q &&
      remaining === 0
    ) {
      submit();
    }
  }, [remaining]);

  /*
   * CORRECTION
   */
  function submit() {
    if (feedback || !q) return;

    let ok = false;

    if (q.type === 'QCM') {
      ok =
        JSON.stringify([...selected].sort()) ===
        JSON.stringify([...(q.correct || [])].sort());
    } else {
      const normalizedAnswer = answer
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      ok = (q.expected || []).some((expected) => {
        const normalizedExpected = expected
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        return (
          normalizedAnswer === normalizedExpected ||
          normalizedAnswer.includes(normalizedExpected)
        );
      });
    }

    setFeedback(ok ? 'correct' : 'incorrect');

    if (ok) {
      setScore((s) => s + 1);
    }
  }

  async function saveAttempt(finalScore: number) {
  if (!user) return;

  const supabase = createClient();

  const { data: clinicalCase, error: caseError } = await supabase
    .from('clinical_cases')
    .select('id')
    .eq('slug', 'choc-septique-urinaire')
    .single();

  if (caseError || !clinicalCase) {
    console.error('Erreur récupération du cas', caseError);
    return;
  }

  const { error } = await supabase
    .from('attempts')
    .insert({
      user_id: user.id,
      case_id: clinicalCase.id,
      score: finalScore,
      total: questions.length,
    });

  if (error) {
    console.error('Erreur enregistrement résultat', error);
  }
}
  async function next() {
  if (idx === questions.length - 1) {
    await saveAttempt(score);
    setFinished(true);
    return;
  }

  setIdx((i) => i + 1);
  setSelected([]);
  setAnswer('');
  setFeedback(null);
}

  function restart() {
    setStarted(false);
    setIdx(0);
    setSelected([]);
    setAnswer('');
    setFeedback(null);
    setScore(0);
    setFinished(false);
  }

  /*
   * ÉCRAN DE CHARGEMENT
   */
  if (loading) {
    return (
      <main className="shell">
        <section className="result">
          <span className="eyebrow">AR-QUIZ</span>
          <h1>Chargement du cas clinique…</h1>
          <p>Connexion à Supabase.</p>
        </section>
      </main>
    );
  }

  /*
   * ERREUR SUPABASE
   */
  if (loadError) {
    return (
      <main className="shell">
        <section className="result">
          <span className="eyebrow">ERREUR</span>
          <h1>Impossible de charger le cas.</h1>
          <p>{loadError}</p>
        </section>
      </main>
    );
  }

  /*
   * ACCUEIL
   */
  if (!started) {
    return (
      <main className="shell">
        <header>
          <div className="brand">
            <span className="mark">AR</span>

            <div>
              <strong>AR-QUIZ</strong>
              <small>Anesthésie · Réanimation</small>
            </div>
          </div>

          <span className="pill">V1 · Supabase</span>
        </header>
        <AuthPanel />
        <section className="hero">
          <div>
            <span className="eyebrow">CAS 001 · RÉANIMATION</span>

            <h1>
              Choc septique
              <br />
              <em>urinaire</em>
            </h1>

            <p>
              Un cas clinique progressif en {questions.length} questions,
              mêlant QCM et QROC. Le temps de réponse varie selon la
              complexité.
            </p>

            <button onClick={() => setStarted(true)}>
              Commencer le cas <span>→</span>
            </button>
          </div>

          <aside>
            <div className="stat">
              <b>{String(questions.length).padStart(2, '0')}</b>
              <span>questions</span>
            </div>

            <div className="stat">
              <b>20–60 s</b>
              <span>par question</span>
            </div>

            <div className="stat">
              <b>QCM + QROC</b>
              <span>formats</span>
            </div>
          </aside>
        </section>

        <footer>
          Cas pédagogique fictif · Vérifier les protocoles locaux et les
          recommandations actualisées avant utilisation clinique.
        </footer>
      </main>
    );
  }

  /*
   * RÉSULTAT
   */
  if (finished) {
    return (
      <main className="shell">
        <header>
          <div className="brand">
            <span className="mark">AR</span>

            <div>
              <strong>AR-QUIZ</strong>
              <small>Résultat</small>
            </div>
          </div>
        </header>

        <section className="result">
          <span className="eyebrow">CAS TERMINÉ</span>

          <div className="score">
            {score}
            <span>/ {questions.length}</span>
          </div>

          <h1>
            {score === questions.length
              ? 'Excellent parcours.'
              : score >= 3
              ? 'Bonne maîtrise du cas.'
              : 'Cas à reprendre.'}
          </h1>

          <p>
            Votre score porte sur les réponses exactes aux{' '}
            {questions.length} étapes.
          </p>

          <button onClick={restart}>Recommencer</button>
        </section>
      </main>
    );
  }

  /*
   * QUESTION
   */
  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <span className="mark">AR</span>

          <div>
            <strong>AR-QUIZ</strong>
            <small>Choc septique urinaire</small>
          </div>
        </div>

        <div className="timer">
          <span>Temps</span>
          <b>{remaining}s</b>
        </div>
      </header>

      <div className="progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <section className="case">
        <div className="case-head">
          <span className="eyebrow">
            QUESTION {idx + 1} / {questions.length}
          </span>

          <span className="type">
            {q.type} · {q.time}s
          </span>
        </div>

        <h1>{q.title}</h1>

        <p className="stem">{q.stem}</p>

        {q.type === 'QCM' ? (
          <div className="options">
            {q.options!.map((option, i) => (
              <button
                key={i}
                className={`option ${
                  selected.includes(i) ? 'chosen' : ''
                } ${
                  feedback && q.correct!.includes(i) ? 'right' : ''
                }`}
                disabled={!!feedback}
                onClick={() =>
                  setSelected((s) =>
                    s.includes(i)
                      ? s.filter((x) => x !== i)
                      : [...s, i]
                  )
                }
              >
                <span className="box">
                  {selected.includes(i) ? '✓' : ''}
                </span>

                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            disabled={!!feedback}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Votre réponse…"
          />
        )}

        {!feedback ? (
          <button className="validate" onClick={submit}>
            Valider la réponse
          </button>
        ) : (
          <div className={`feedback ${feedback}`}>
            <strong>
              {feedback === 'correct'
                ? '✓ Réponse correcte'
                : '✕ Réponse à corriger'}
            </strong>

            <p>{q.explanation}</p>

            {q.nextData && (
              <div className="next-data">
                <b>Évolution du cas</b>
                <span>{q.nextData}</span>
              </div>
            )}

            <button onClick={next}>
              {idx === questions.length - 1
                ? 'Voir le résultat'
                : 'Continuer →'}
            </button>
          </div>
        )}
      </section>

      <footer>
        Cas pédagogique fictif · AR-QUIZ
      </footer>
    </main>
  );
}