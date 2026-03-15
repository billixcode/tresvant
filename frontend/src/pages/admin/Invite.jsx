import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import InvitePanel from '../../components/admin/InvitePanel'

export default function Invite() {
  const [adminUsers, setAdminUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdmins()
  }, [])

  async function loadAdmins() {
    setLoading(true)
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setAdminUsers(data)
    setLoading(false)
  }

  if (loading) return <p className="p-8 text-neutral-400">Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-100">Admin Invitations</h1>
      <InvitePanel adminUsers={adminUsers} onRefresh={loadAdmins} />
    </div>
  )
}
