import { useState } from 'react'
import { Mail, UserPlus, Trash2, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function InvitePanel({ adminUsers, onRefresh }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      // NOTE: supabase.auth.admin.inviteUserByEmail requires the service_role key.
      // In production, this should call a Supabase Edge Function that uses the
      // service_role key server-side. The anon key used here will NOT have admin
      // privileges. Wire this to an edge function endpoint for production use.
      const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email.trim())

      if (inviteError) throw inviteError

      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      onRefresh()
    } catch (err) {
      console.error('Invite failed:', err)
      setError(err.message || 'Failed to send invitation')
    }

    setSending(false)
  }

  async function revokeAccess(userId) {
    if (!confirm('Revoke access for this admin? They will no longer be able to manage content.')) return

    const { error } = await supabase.from('admin_users').delete().eq('id', userId)
    if (error) {
      console.error('Revoke failed:', error)
    } else {
      onRefresh()
    }
  }

  // Separate confirmed vs pending (admins without a confirmed login)
  const confirmed = adminUsers.filter(u => u.confirmed_at || u.last_sign_in)
  const pending = adminUsers.filter(u => !u.confirmed_at && !u.last_sign_in)

  return (
    <div className="space-y-8">
      {/* Invite form */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Mail className="h-5 w-5 text-indigo-400" />
          Invite Admin
        </h2>
        <form onSubmit={handleInvite} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        {success && <p className="mt-2 text-xs text-green-400">{success}</p>}
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-300">Pending Invitations</h3>
          <div className="space-y-1">
            {pending.map(user => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border border-amber-900/50 bg-neutral-800 px-4 py-3">
                <div>
                  <p className="text-sm text-neutral-200">{user.email}</p>
                  {user.invited_by && (
                    <p className="text-xs text-neutral-500">Invited by {user.invited_by}</p>
                  )}
                </div>
                <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-xs text-amber-400">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current admins */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-300">
          <Shield className="h-4 w-4 text-indigo-400" />
          Current Admins
        </h3>
        <div className="space-y-1">
          {confirmed.map(user => (
            <div key={user.id} className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3">
              <div>
                <p className="text-sm text-neutral-200">{user.email}</p>
                <div className="flex gap-3 text-xs text-neutral-500">
                  {user.invited_by && <span>Invited by {user.invited_by}</span>}
                  {user.created_at && <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <button
                onClick={() => revokeAccess(user.id)}
                className="flex items-center gap-1 rounded p-1.5 text-red-500 hover:bg-red-900/30"
                title="Revoke access"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {confirmed.length === 0 && (
            <p className="text-sm text-neutral-500">No confirmed admins.</p>
          )}
        </div>
      </div>
    </div>
  )
}
