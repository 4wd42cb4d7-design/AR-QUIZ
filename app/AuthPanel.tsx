'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function AuthPanel() {
  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [mode, setMode] =
    useState<
      'login' |
      'signup' |
      'forgot'
    >('login');

  const [userEmail, setUserEmail] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(
          user.email
        );
      }
    }

    loadUser();
  }, []);

  function resetMessages() {
    setMessage('');
    setErrorMessage('');
  }

  async function handleLogin() {
    resetMessages();

    if (!email || !password) {
      setErrorMessage(
        'Renseignez votre email et votre mot de passe.'
      );

      return;
    }

    setBusy(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase.auth
          .signInWithPassword({
            email,
            password,
          });

      if (error) {
        throw error;
      }

      setUserEmail(
        data.user?.email ??
          email
      );

      setPassword('');

      setMessage(
        'Connexion réussie.'
      );

      router.refresh();

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de se connecter.'
      );
    }

    setBusy(false);
  }

  async function handleSignup() {
    resetMessages();

    if (!email || !password) {
      setErrorMessage(
        'Renseignez votre email et choisissez un mot de passe.'
      );

      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        'Le mot de passe doit contenir au moins 6 caractères.'
      );

      return;
    }

    setBusy(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase.auth
          .signUp({
            email,
            password,

            options: {
              emailRedirectTo:
                window.location.origin,
            },
          });

      if (error) {
        throw error;
      }

      if (data.session) {
        setUserEmail(
          data.user?.email ??
            email
        );

        setMessage(
          'Compte créé avec succès.'
        );

        router.refresh();

      } else {
        setMessage(
          'Compte créé. Consultez votre boîte mail pour confirmer votre adresse.'
        );
      }

      setPassword('');

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de créer le compte.'
      );
    }

    setBusy(false);
  }

  async function handleForgotPassword() {
    resetMessages();

    if (!email.trim()) {
      setErrorMessage(
        'Renseignez votre adresse email.'
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
          .resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                `${window.location.origin}/reset-password`,
            }
          );

      if (error) {
        throw error;
      }

      setMessage(
        'Un lien de réinitialisation vient de vous être envoyé par email.'
      );

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’envoyer le lien de réinitialisation.'
      );
    }

    setBusy(false);
  }

  async function handleLogout() {
    resetMessages();

    const supabase =
      createClient();

    await supabase.auth
      .signOut();

    setUserEmail('');

    setEmail('');

    setPassword('');

    setMode('login');

    router.refresh();
  }

  if (userEmail) {
    return (
      <div
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        <div>
          Connecté en tant que
        </div>

        <strong>
          {userEmail}
        </strong>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/compte'
            )
          }
        >
          Mon compte
        </button>

        <button
          type="button"
          onClick={
            handleLogout
          }
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
      }}
    >
      {mode ===
        'forgot' ? (
        <>
          <h3
            style={{
              margin: 0,
            }}
          >
            Mot de passe oublié
          </h3>

          <p
            style={{
              margin: 0,
              opacity: 0.75,
              fontSize: 14,
            }}
          >
            Indiquez votre adresse email.
            Vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Adresse email"
            autoComplete="email"
          />

          <button
            type="button"
            disabled={busy}
            onClick={
              handleForgotPassword
            }
          >
            {busy
              ? 'Envoi…'
              : 'Envoyer le lien'}
          </button>

          <button
            type="button"
            onClick={() => {
              resetMessages();
              setMode(
                'login'
              );
            }}
            style={{
              background:
                'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration:
                'underline',
            }}
          >
            ← Retour à la connexion
          </button>
        </>
      ) : (
        <>
          <h3
            style={{
              margin: 0,
            }}
          >
            {mode ===
            'login'
              ? 'Connexion'
              : 'Créer un compte'}
          </h3>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Adresse email"
            autoComplete="email"
          />

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Mot de passe"
            autoComplete={
              mode ===
              'login'
                ? 'current-password'
                : 'new-password'
            }
          />

          {mode ===
          'login' ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={
                  handleLogin
                }
              >
                {busy
                  ? 'Connexion…'
                  : 'Se connecter'}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetMessages();

                  setMode(
                    'forgot'
                  );
                }}
                style={{
                  background:
                    'transparent',
                  border: 'none',
                  padding: 0,
                  cursor:
                    'pointer',
                  textDecoration:
                    'underline',
                  fontSize: 14,
                }}
              >
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={
                handleSignup
              }
            >
              {busy
                ? 'Création…'
                : 'Créer mon compte'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              resetMessages();

              setMode(
                mode ===
                'login'
                  ? 'signup'
                  : 'login'
              );
            }}
            style={{
              background:
                'transparent',
              border: 'none',
              cursor:
                'pointer',
              textDecoration:
                'underline',
            }}
          >
            {mode ===
            'login'
              ? 'Créer un compte'
              : 'J’ai déjà un compte'}
          </button>
        </>
      )}

      {message && (
        <div
          style={{
            padding: 10,

            borderRadius: 8,

            background:
              'rgba(30, 150, 90, 0.10)',

            color:
              '#176b47',

            fontSize: 14,
          }}
        >
          {message}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: 10,

            borderRadius: 8,

            background:
              'rgba(200, 50, 50, 0.10)',

            color:
              '#9b2525',

            fontSize: 14,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}