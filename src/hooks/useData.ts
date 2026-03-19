'use client'

import { useState, useEffect, useCallback } from 'react'

export function useContracts(initialPage = 1) {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '15',
      search,
      ...(activeFilter && { active: activeFilter }),
    })
    const res = await fetch(`/api/contracts?${params}`)
    const result = await res.json()
    setData(result.data || [])
    setTotal(result.total || 0)
    setLoading(false)
  }, [page, search, activeFilter])

  useEffect(() => { load() }, [load])

  return { data, total, page, setPage, loading, search, setSearch, activeFilter, setActiveFilter, reload: load }
}

export function useContract(id: string | number) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/contracts/${id}`)
    if (res.ok) {
      setData(await res.json())
    } else {
      setError('Contract not found')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { if (id) load() }, [load, id])

  return { data, loading, error, reload: load }
}

export function useActivityLog(initialPage = 1) {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [module, setModule] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '20',
      ...(action && { action }),
      ...(module && { module }),
    })
    const res = await fetch(`/api/activity?${params}`)
    const result = await res.json()
    setData(result.data || [])
    setTotal(result.total || 0)
    setLoading(false)
  }, [page, action, module])

  useEffect(() => { load() }, [load])

  return { data, total, page, setPage, loading, action, setAction, module, setModule, reload: load }
}

export function useDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/dashboard')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { data, loading, reload: load }
}
