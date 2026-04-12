'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type PermissionLevel = {
  can_read: boolean
  can_write: boolean
  can_delete: boolean
}

export type PermissionsMap = Record<string, PermissionLevel>

export type UsePermissionsResult = {
  loading: boolean
  isOwner: boolean
  ownerId: string | null
  permissions: PermissionsMap
  can: (module: string, action?: 'read' | 'write' | 'delete') => boolean
}

export function usePermissions(): UsePermissionsResult {
  const [loading, setLoading]         = useState(true)
  const [isOwner, setIsOwner]         = useState(false)
  const [ownerId, setOwnerId]         = useState<string | null>(null)
  const [permissions, setPermissions] = useState<PermissionsMap>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Vérifier si cet user est membre d'un autre compte
      const { data: membership } = await supabase
        .from('team_members')
        .select('id, owner_id, statut')
        .eq('member_user_id', user.id)
        .eq('statut', 'actif')
        .maybeSingle()

      if (!membership) {
        // Propriétaire — accès total à tout
        setIsOwner(true)
        setOwnerId(user.id)
        setLoading(false)
        return
      }

      // Membre invité — charger ses permissions
      setIsOwner(false)
      setOwnerId(membership.owner_id)

      const { data: perms } = await supabase
        .from('team_permissions')
        .select('module, can_read, can_write, can_delete')
        .eq('member_id', membership.id)

      const map: PermissionsMap = {}
      ;(perms || []).forEach(p => {
        map[p.module] = {
          can_read: p.can_read,
          can_write: p.can_write,
          can_delete: p.can_delete,
        }
      })

      setPermissions(map)
      setLoading(false)
    }
    init()
  }, [])

  const can = (module: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    if (isOwner) return true
    const p = permissions[module]
    if (!p) return false
    if (action === 'read')   return p.can_read
    if (action === 'write')  return p.can_write
    if (action === 'delete') return p.can_delete
    return false
  }

  return { loading, isOwner, ownerId, permissions, can }
}
