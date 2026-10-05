'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  createClient,
} from '../../lib/supabase/client';

export default function ResetPasswordPage() {
  const router =
    useRouter();

  const [password, setPassword] =
    useState('');

  const [
    passwordConfirm,
    setPasswordConfirm,
  ] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [ready, setReady] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    const supabase =
      createClient();

    async function checkSession() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth
          .getSession();

      if (session) {
        setReady(true);
      }
    }

    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {
            if (
              event ===
                'PASSWORD_RECOVERY' ||
              session
            ) {
              setReady(true);
            }
          }
        );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword() {
    setMessage('');
    setErrorMessage('');

    if (
      password.length <
      6
    ) {
      setErrorMessage(
        'Le mot de passe doit contenir au moins 6 caractères.'
      );

      return;
    }

    if (
      password !==
      passwordConfirm
    ) {
      setErrorMessage(
        'Les deux mots de passe ne correspondent pas.'
      );

      return;
    }

    setBusy(true);

    try {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth
          .updateUser({
            password,
          });

      if (error) {
        throw error;
      }

      setMessage(
        'Votre mot de passe a été modifié.'
      );

      setPassword('');
      setPasswordConfirm('');

      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de modifier le mot de passe.'
      );
    }

    setBusy(false);
  }

  return (
    <main
      style={{
        minHeight:
          '100vh',

        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'center',

        background:
          '#f8f4ec',

        padding:
          20,
      }}
    >
      <section
        style={{
          width:
            '100%',

          maxWidth:
            440,

          background:
            'white',

          borderRadius:
            18,

          padding:
            28,

          boxShadow:
            '0 15px 45px rgba(0,0,0,0.12)',

          display:
            'grid',

          gap:
            16,
        }}
      >
        <div
          style={{
            fontWeight:
              800,

            fontSize:
              26,
          }}
        >
          MARGUEZ
        </div>

        <h1
          style={{
            margin: 0,
          }}
        >
          Nouveau mot de passe
        </h1>

        {!ready ? (
          <p>
            Vérification du lien de réinitialisation…
          </p>
        ) : (
          <>
            <label>
              <strong>
                Nouveau mot de passe
              </strong>

              <input
                type="password"
                value={
                  password
                }
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
                style={{
                  width:
                    '100%',
                }}
              />
            </label>

            <label>
              <strong>
                Confirmer le mot de passe
              </strong>

              <input
                type="password"
                value={
                  passwordConfirm
                }
                onChange={(e) =>
                  setPasswordConfirm(
                    e.target.value
                  )
                }
                autoComplete="new-password"
                style={{
                  width:
                    '100%',
                }}
              />
            </label>

            <button
              type="button"
              disabled={busy}
              onClick={
                updatePassword
              }
            >
              {busy
                ? 'Modification…'
                : 'Modifier mon mot de passe'}
            </button>
          </>
        )}

        {message && (
          <div
            style={{
              padding:
                12,

              borderRadius:
                8,

              background:
                'rgba(30,150,90,0.10)',

              color:
                '#176b47',
            }}
          >
            {message}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding:
                12,

              borderRadius:
                8,

              background:
                'rgba(200,50,50,0.10)',

              color:
                '#9b2525',
            }}
          >
            {errorMessage}
          </div>
        )}
      </section>
    </main>
  );
}