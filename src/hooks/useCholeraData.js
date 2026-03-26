import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const numberValue = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const normalized =
    typeof value === 'string' ? value.replace(/,/g, '').trim() : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const dbConfirmedValue = (row) =>
  numberValue(
    row.cch ??
      row.cCh ??
      row.CCH ??
      row.confirmed_cases ??
      row.confirmed ??
      row.cases_confirmed,
  )

const buildDbTotals = (rows) =>
  (rows || []).reduce(
    (acc, row) => {
      acc.totalReports += 1
      acc.totalSuspected += numberValue(row.sch ?? row.sCh)
      acc.totalConfirmed += dbConfirmedValue(row)
      acc.totalDeaths += numberValue(row.deaths)
      acc.cfrTotal += numberValue(row.cfr ?? row.CFR)
      return acc
    },
    {
      totalReports: 0,
      totalSuspected: 0,
      totalConfirmed: 0,
      totalDeaths: 0,
      cfrTotal: 0,
    },
  )

const parseRow = (row, idx) => {
  let reportingDate = null

  // Support multiple possible date column spellings so newly inserted rows
  // appear in charts without requiring exact naming.
  const rawDate =
    row.reporting_date ??
    row.reportingDate ??
    row.reporting_date_raw ??
    row.reportingDateRaw ??
    row.report_date ??
    row.reportingDateRaw

  if (rawDate) {
    const dateValue = new Date(rawDate)
    if (!Number.isNaN(dateValue.valueOf())) {
      reportingDate = dateValue
    }
  }

  return {
    id: row.id ?? row.index ?? idx,
    location: row.location ?? row.district ?? 'Unknown',
    region:
      row.region && row.region.trim()
        ? row.region.trim()
        : 'Unknown',
    district:
      row.district && row.district.trim()
        ? row.district.trim()
        : '',
    sCh: numberValue(row.sch ?? row.sCh),
    cCh: numberValue(
      row.cch ??
        row.cCh ??
        row.CCH ??
        row['cCh'] ??
        row['CCH'] ??
        row.confirmed_cases ??
        row.confirmed ??
        row.cases_confirmed,
    ),
    CFR: numberValue(row.cfr ?? row.CFR),
    deaths: numberValue(row.deaths),
    predictedSCh:
      row.predicted_sCh !== undefined && row.predicted_sCh !== null && row.predicted_sCh !== ''
        ? numberValue(row.predicted_sCh)
        : row.predicted_sch !== undefined && row.predicted_sch !== null && row.predicted_sch !== ''
          ? numberValue(row.predicted_sch)
          : null,
    reportingDate,
    reportingDateRaw: rawDate ?? row.reporting_date ?? '',
    TL: row.tl ?? row.TL,
    TR: row.tr ?? row.TR,
    source: row.source,
    raw: row,
  }
}

const POLL_INTERVAL_MS = 15_000 // normal polling interval
const FAST_FALLBACK_POLL_INTERVAL_MS = 5_000 // fast fallback when Realtime websocket is unavailable
const REFRESH_DEBOUNCE_MS = 1200
const MAX_RETRIES = 4
const RETRY_DELAYS_MS = [1000, 3000, 6000, 15000]

const DATASET_START_DATE = new Date(2011, 0, 1)

const PIPELINE_MERGE_ENABLED = import.meta.env.VITE_ENABLE_PIPELINE_MERGE === 'true'
const REALTIME_DISABLED = import.meta.env.VITE_DISABLE_SUPABASE_REALTIME === 'true'
// Default to enabled so newly inserted rows get predictions quickly,
// even if realtime is temporarily unavailable.
const PIPELINE_WRITEBACK_ENABLED =
  import.meta.env.VITE_ENABLE_PIPELINE_WRITEBACK !== 'false' || PIPELINE_MERGE_ENABLED

const PAGE_SIZE = 1000

function useCholeraData() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [minDate, setMinDate] = useState(null)
  const [maxDate, setMaxDate] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [dbSummary, setDbSummary] = useState({
    totalReports: 0,
    totalSuspected: 0,
    totalConfirmed: 0,
    totalDeaths: 0,
    avgCFR: 0,
    positivityRate: 0,
  })
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false)
  const channelRef = useRef(null)
  const warnedRealtimeRef = useRef(false)
  const realtimeRetryTimerRef = useRef(null)
  const realtimeRetryCountRef = useRef(0)
  const [realtimeAttemptNonce, setRealtimeAttemptNonce] = useState(0)
  const realtimeRestartInProgressRef = useRef(false)
  const pipelineWritebackTimerRef = useRef(null)
  const pipelineWritebackInFlightRef = useRef(false)

  // Use a ref so interval and Realtime callbacks always call the latest fetchData
  const fetchDataRef = useRef(null)
  const refreshTimerRef = useRef(null)

  const requestRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      fetchDataRef.current?.(true)
    }, REFRESH_DEBOUNCE_MS)
  }, [])

  const schedulePipelineWriteback = useCallback(
    (reason) => {
      if (!PIPELINE_WRITEBACK_ENABLED) return
      if (pipelineWritebackInFlightRef.current) return
      // eslint-disable-next-line no-console
      console.info(`[Cholera] Scheduling pipeline write-back (${reason})`)

      const explicitApiUrl =
        import.meta.env.VITE_XGBOOST_API_URL || import.meta.env.VITE_LSTM_API_URL
      const pipelineApiUrl =
        explicitApiUrl ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? 'http://localhost:5001'
          : '')

      if (!pipelineApiUrl) return

      if (pipelineWritebackTimerRef.current) {
        clearTimeout(pipelineWritebackTimerRef.current)
      }

      pipelineWritebackTimerRef.current = setTimeout(async () => {
        pipelineWritebackInFlightRef.current = true
        try {
          // OnlyMissing prevents infinite loops.
          const resp = await fetch(
            `${pipelineApiUrl}/api/pipeline/forecast?writeBack=1&onlyMissing=1&limit=200`,
          )
          if (!resp.ok) {
            throw new Error(`Pipeline write-back failed: HTTP ${resp.status}`)
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[Cholera] pipeline write-back failed (${reason})`, e)
        } finally {
          pipelineWritebackInFlightRef.current = false
        }
      }, 1500)
    },
    [],
  )

  const fetchData = useCallback(async (isRetry = false) => {
    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
      setLoading(false)
      return
    }

    const attempt = async (retryCount = 0) => {
      try {
        // Supabase/PostgREST commonly returns at most 1000 rows unless paginated.
        // If the dataset grows past that, new inserts may not show up unless we
        // page or order deterministically.
        const rows = []
        let offset = 0
        // Prefer ordering by reporting_date first (dashboard semantics),
        // fallback to created_at for newly inserted manual rows.
        // (If either column is missing, PostgREST will error and we'll retry.)
        while (true) {
          // eslint-disable-next-line no-await-in-loop
          const { data: page, error: pageError } = await supabase
            .from('cholera_reports')
            .select('*')
            .order('reporting_date', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + PAGE_SIZE - 1)

          if (pageError) {
            throw pageError
          }

          if (page && page.length) rows.push(...page)
          if (!page || page.length < PAGE_SIZE) break
          offset += PAGE_SIZE
        }

        if (!rows || rows.length === 0) {
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS_MS[retryCount] ?? 15000
            setTimeout(() => attempt(retryCount + 1), delay)
            if (!isRetry) setError('Reconnecting…')
            return
          }
          setError('No records found in Supabase table cholera_reports.')
          setLoading(false)
          return
        }

        // eslint-disable-next-line no-console
        console.info(`[Cholera] Fetched ${rows.length.toLocaleString()} rows from Supabase`)

        const parsedRows = rows.map(parseRow)
        const baselineRows = parsedRows.filter(
          (row) => row.reportingDate && row.reportingDate >= DATASET_START_DATE,
        )

        // If we want pipeline write-back, ensure missing predictions get filled even
        // when realtime is unavailable (polling-based catch-up).
        const hasPredictedColumn = (rows || []).some(
          (r) =>
            r
            && (Object.prototype.hasOwnProperty.call(r, 'predicted_sCh')
              || Object.prototype.hasOwnProperty.call(r, 'predicted_sch')),
        )
        const needsPredictedWriteback =
          hasPredictedColumn && baselineRows.some((r) => r.predictedSCh === null)

        if (needsPredictedWriteback) {
          schedulePipelineWriteback('polling-missing')
        }

        // Keep DB-derived totals consistent with the 2011+ baseline.
        const baselineRawRows = (rows || []).filter((row) => {
          if (!row?.reporting_date) return false
          const dateValue = new Date(row.reporting_date)
          return !Number.isNaN(dateValue.valueOf()) && dateValue >= DATASET_START_DATE
        })

        const dbTotals = buildDbTotals(baselineRawRows)
        const dbSummarySnapshot = {
          ...dbTotals,
          avgCFR: dbTotals.totalReports ? dbTotals.cfrTotal / dbTotals.totalReports : 0,
          positivityRate:
            dbTotals.totalSuspected > 0
              ? (dbTotals.totalConfirmed / dbTotals.totalSuspected) * 100
              : 0,
        }
        const datedRows = baselineRows
        let finalRows = baselineRows

        // Optional feature flag: merge pipeline predictions into a separate field.
        // DB values remain the source-of-truth for dashboard totals.
        if (PIPELINE_MERGE_ENABLED && !PIPELINE_WRITEBACK_ENABLED) {
          const explicitApiUrl =
            import.meta.env.VITE_XGBOOST_API_URL || import.meta.env.VITE_LSTM_API_URL
          const pipelineApiUrl =
            explicitApiUrl ||
            (typeof window !== 'undefined' && window.location.hostname === 'localhost'
              ? 'http://localhost:5001'
              : '')

          if (pipelineApiUrl) {
            try {
                const resp = await fetch(
                  `${pipelineApiUrl}/api/pipeline/forecast?writeBack=0&onlyMissing=1&limit=200`,
                )
              if (resp.ok) {
                const payload = await resp.json()
                const preds = payload.predictions || []
                const byId = new Map()
                preds.forEach((p) => {
                  if (p && p.id !== undefined) {
                    // Some payloads may use different casing.
                    byId.set(String(p.id), p)
                  }
                })
                // Keep the 2011+ baseline window even when merging pipeline predictions.
                // (Without this, earlier years could leak into the dashboard charts.)
                finalRows = baselineRows.map((row) => {
                  const match = byId.get(String(row.id))
                  const matchPred =
                    match?.predicted_sCh !== undefined
                      ? match.predicted_sCh
                      : match?.predicted_sch
                  if (match && typeof matchPred === 'number') {
                    return { ...row, predictedSCh: matchPred, sChFromPipeline: true }
                  }
                  return row
                })
              }
            } catch (mergeErr) {
              // eslint-disable-next-line no-console
              console.warn('Failed to fetch optional pipeline predictions', mergeErr)
            }
          }
        }

        const timestamps = datedRows.map((row) => row.reportingDate.valueOf())
        const minActual = timestamps.length ? new Date(Math.min(...timestamps)) : null
        // Ensure the dashboard "earliest" bound is at least 2011-01-01,
        // so chart axes start consistently even if Jan 2011 has no rows.
        const min = minActual
          ? new Date(Math.min(minActual.valueOf(), DATASET_START_DATE.valueOf()))
          : DATASET_START_DATE
        const max = timestamps.length ? new Date(Math.max(...timestamps)) : null

        setMinDate(min)
        setMaxDate(max)
        setData(finalRows)
        setDbSummary(dbSummarySnapshot)
        setError('')
        setLastUpdatedAt(new Date())
        setLoading(false)
      } catch (err) {
        console.error('Unexpected Supabase fetch error:', err)
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[retryCount] ?? 15000
          setTimeout(() => attempt(retryCount + 1), delay)
          if (!isRetry) setError('Reconnecting…')
          return
        }
        setError(err.message || 'Failed to load dataset from Supabase.')
        setLoading(false)
      }
    }

    await attempt(0)
  }, [schedulePipelineWriteback]) // stable — no dependencies change

  // Keep the ref in sync with the latest fetchData
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime: refetch when cholera_reports changes.
  // Requires the table to be added to the supabase_realtime publication.
  // See: supabase/migrations/002_user_profiles_trigger.sql
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    if (REALTIME_DISABLED) {
      setRealtimeUnavailable(true)
      return undefined
    }

    const channel = supabase
      .channel('cholera_reports_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cholera_reports',
        },
        (payload) => {
          // Realtime can emit bursts; debounce to avoid flooding requests
          requestRefresh()

          // Trigger batch predictions only when the new/updated row doesn't have predictions yet.
          // This prevents infinite loops because the pipeline write-back updates the same table.
          const eventType = payload?.eventType
          if (eventType !== 'INSERT' && eventType !== 'UPDATE') return

          const next = payload?.new
          if (!next) return

          const nextPred =
            next.predicted_sCh !== undefined ? next.predicted_sCh : next.predicted_sch
          const nextPredNum =
            nextPred === null || nextPred === undefined || nextPred === ''
              ? null
              : Number(nextPred)
          const needsPred =
            nextPredNum === null || Number.isNaN(nextPredNum)

          if (!needsPred) return

          schedulePipelineWriteback('realtime-missing')
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeUnavailable(false)
          warnedRealtimeRef.current = false
          realtimeRestartInProgressRef.current = false
          realtimeRetryCountRef.current = 0
          if (realtimeRetryTimerRef.current) {
            clearTimeout(realtimeRetryTimerRef.current)
            realtimeRetryTimerRef.current = null
          }
          return
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (realtimeRestartInProgressRef.current) return
          realtimeRestartInProgressRef.current = true
          setRealtimeUnavailable(true)
          // Force an immediate refresh so dashboard is not stuck waiting
          fetchDataRef.current?.(true)
          if (!warnedRealtimeRef.current) {
            console.warn(
              '[Cholera] Realtime unavailable — using polling fallback for this session.',
            )
            warnedRealtimeRef.current = true
          }

          // Retry subscription after a backoff delay so the realtime path
          // can recover without requiring a full app reload.
          realtimeRetryCountRef.current += 1
          const backoffMs = Math.min(
            60_000,
            5_000 * 2 ** Math.max(0, realtimeRetryCountRef.current - 1),
          )
          if (!realtimeRetryTimerRef.current) {
            realtimeRetryTimerRef.current = setTimeout(() => {
              realtimeRetryTimerRef.current = null
              realtimeRestartInProgressRef.current = false
              setRealtimeAttemptNonce((n) => n + 1)
            }, backoffMs)
          }
        }
      })

    channelRef.current = channel

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      if (channelRef.current) {
        try {
          // Best-effort cleanup; realtime websockets may already be closed.
          // eslint-disable-next-line no-await-in-loop
          supabase.removeChannel(channelRef.current)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[Cholera] removeChannel cleanup failed', e)
        }
        channelRef.current = null
      }
      if (realtimeRetryTimerRef.current) {
        clearTimeout(realtimeRetryTimerRef.current)
        realtimeRetryTimerRef.current = null
      }
      realtimeRestartInProgressRef.current = false
    }
  }, [requestRefresh, realtimeAttemptNonce]) // requestRefresh is stable

  // Polling fallback: refresh every 30 s so new rows appear even without Realtime
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const intervalMs = realtimeUnavailable
      ? FAST_FALLBACK_POLL_INTERVAL_MS
      : POLL_INTERVAL_MS
    const interval = setInterval(() => {
      fetchDataRef.current?.(true)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [realtimeUnavailable])

  // Refresh when the tab regains focus/visibility so recently inserted rows appear immediately.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const onFocus = () => {
      fetchDataRef.current?.(true)
      // If we are currently in polling-only mode, attempt to bring realtime back.
      if (realtimeUnavailable) setRealtimeAttemptNonce((n) => n + 1)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDataRef.current?.(true)
        if (realtimeUnavailable) setRealtimeAttemptNonce((n) => n + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [realtimeUnavailable])

  return {
    data,
    loading,
    error,
    minDate,
    maxDate,
    lastUpdatedAt,
    dbSummary,
    refetch: fetchData,
    restartRealtime: () => {
      realtimeRetryCountRef.current = 0
      if (realtimeRetryTimerRef.current) {
        clearTimeout(realtimeRetryTimerRef.current)
        realtimeRetryTimerRef.current = null
      }
      setRealtimeAttemptNonce((n) => n + 1)
    },
  }
}

export default useCholeraData
