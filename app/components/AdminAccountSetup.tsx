'use client'

import { useEffect } from 'react'
import { createAdminAccountIfNeeded } from '@/lib/createAdminAccount'

/**
 * Component dat ervoor zorgt dat het admin account bestaat
 * Wordt uitgevoerd bij het laden van de app
 */
export default function AdminAccountSetup() {
  useEffect(() => {
    createAdminAccountIfNeeded().catch(console.error)
  }, [])

  return null
}


