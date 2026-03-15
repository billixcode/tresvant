import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-surface)">
        <p className="text-(--color-text-muted)">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { error: signInError } = await useAuth.signIn?.(email, password);
      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
        setSubmitting(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-surface) px-4">
      <div className="w-full max-w-sm rounded-2xl bg-(--color-brand)/5 border border-(--color-brand)/10 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-(--color-text)">
          Tresvant Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-(--color-text-muted)"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-(--color-brand)/20 bg-(--color-surface) px-3 py-2 text-(--color-text) placeholder:text-(--color-text-muted)/50 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              placeholder="you@example.com"
            />
          </div>

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
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-(--color-brand)/20 bg-(--color-surface) px-3 py-2 text-(--color-text) placeholder:text-(--color-text-muted)/50 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              placeholder="Enter your password"
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
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
