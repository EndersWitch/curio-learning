'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProgress } from '@/types/quiz'

export function useProgress(userId: string | null) {
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProgress([])
      setLoading(false)
      return
    }

    async function load() {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)

      setProgress((data ?? []) as UserProgress[])
      setLoading(false)
    }

    load()
  }, [userId])

  function isLevelDone(levelId: string): boolean {
    return progress.some((p) => p.level_id === levelId && p.passed)
  }

  function progressPercent(levelIds: string[]): number {
    if (levelIds.length === 0) return 0
    const passed = levelIds.filter(isLevelDone).length
    return Math.round((passed / levelIds.length) * 100)
  }

  return { progress, loading, isLevelDone, progressPercent }
}
