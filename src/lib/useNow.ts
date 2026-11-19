import { useEffect, useState } from 'react'
import { useAppStore } from './store'

/** «Сейчас» с учётом сдвига времени из демо-панели. */
export function useNow(intervalMs = 20_000): number {
  const timeOffsetMs = useAppStore((state) => state.timeOffsetMs)
  const [now, setNow] = useState(() => Date.now() + timeOffsetMs)

  useEffect(() => {
    setNow(Date.now() + timeOffsetMs)
    const timer = window.setInterval(() => setNow(Date.now() + timeOffsetMs), intervalMs)
    return () => window.clearInterval(timer)
  }, [timeOffsetMs, intervalMs])

  return now
}
