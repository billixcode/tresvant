import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AcceptInvite() {
  const { setPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSessionUser(session.user);
          setReady(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: pwError } = await setPassword(password);
      if (pwError) {
        setError(pwError.message || 'Failed to set password.');
        setSubmitting(false);
        return;
      }

      // Insert the user into admin_users table
      const { error: insertError } = await supabase
        .from('admin_users')
        .upsert(
          { id: sessionUser.id, email: sessionUser.email },
          { onConflict: 'id' }
        );

      if (insertError) {
        setError(insertError.message || 'Failed to register admin user.');
        setSubmitting(false);
        return;
      }

      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-surface)">
        <p className="text-(--color-text-muted)">Verifying invite link...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-surface) px-4">
      <div className="w-full max-w-sm rounded-2xl bg-(--color-brand)/5 border border-(--color-brand)/10 p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-(--color-text)">
          Set Your Password
        </h1>
        <p className="mb-6 text-center text-sm text-(--color-text-muted)">
          Welcome! Create a password to complete your account setup.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-(--color-text-muted)"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="w-full rounded-lg border border-(--color-brand)/20 bg-(--color-surface) px-3 py-2 text-(--color-text) placeholder:text-(--color-text-muted)/50 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-(--color-text-muted)"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-(--color-brand)/20 bg-(--color-surface) px-3 py-2 text-(--color-text) placeholder:text-(--color-text-muted)/50 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              placeholder="Re-enter your password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-lg bg-(--color-accent) px-4 py-2 font-semibold text-(--color-text) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Setting password...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
