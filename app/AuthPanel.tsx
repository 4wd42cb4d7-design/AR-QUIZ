'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function AuthPanel() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage('');

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        setMessage('Compte créé. Vous êtes connecté.');
      } else {
        setMessage(
          'Compte créé. Consultez votre e-mail pour confirmer votre inscription.'
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage('E-mail ou mot de passe incorrect.');
      } else {
        setMessage('');
        setEmail('');
        setPassword('');
      }
    }

    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setMessage('');
  }

  if (userEmail) {
  return (
    <div className="auth-panel">
      <div>
        <small>Connecté</small>
        <strong>{userEmail}</strong>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={() => router.push('/compte')}>
          Mon compte
        </button>

        <button onClick={logout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
 }
  

  return (
    <div className="auth-panel">
      <div>
        <strong>
          {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
        </strong>

        <small>
          {mode === 'login'
            ? 'Retrouvez prochainement vos résultats.'
            : 'Créez un compte pour conserver votre progression.'}
        </small>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          required
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={busy}>
          {busy
            ? 'Patientez…'
            : mode === 'login'
            ? 'Connexion'
            : 'Créer mon compte'}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setMessage('');
        }}
      >
        {mode === 'login'
          ? 'Pas encore de compte ? Créer un compte'
          : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  );
}