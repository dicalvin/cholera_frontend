import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import useXGBoostPredictions from '../hooks/useXGBoostPredictions'
import useWeatherData, { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

const formatSignedPercent = (value) => {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '0.0%'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

const formatShortDate = (d) => {
  if (!d) return '—'
  try {
    const date = d instanceof Date ? d : new Date(d)
    if (Number.isNaN(date.valueOf())) return '—'
    return date.toISOString().split('T')[0]
  } catch {
    return '—'
  }
}

const resolveUgandaDistrictKey = (candidate) => {
  const q = String(candidate || '').toLowerCase()
  const keys = Object.keys(UGANDA_LOCATIONS)
  const match = keys.find((k) => {
    const loc = UGANDA_LOCATIONS[k]
    const locName = String(loc?.name || '').toLowerCase()
    return q.includes(locName) || q.includes(k)
  })
  return match || 'kampala'
}

function PredictionSpreadHero({ historicalData = [], fallbackSpread = null, candidateLabel = '' }) {
  const districtKeys = useMemo(() => Object.keys(UGANDA_LOCATIONS), [])
  const [districtKey, setDistrictKey] = useState(() =>
    resolveUgandaDistrictKey(candidateLabel),
  )
  const [forecastData, setForecastData] = useState(null)

  const { loading: apiLoading, error: apiError, modelAvailable, getForecast } = useXGBoostPredictions()
  const { weatherData } = useWeatherData(districtKey)

  useEffect(() => {
    // Keep a reasonable default when upstream changes.
    setDistrictKey(resolveUgandaDistrictKey(candidateLabel))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateLabel])

  useEffect(() => {
    if (!historicalData || !historicalData.length) return
    if (!weatherData || !weatherData.current) return
    if (!getForecast) return

    const fetchForecast = async () => {
      const historicalSuspected = historicalData
        .filter((d) => d?.sCh !== undefined && d?.sCh !== null)
        .map((d) => Number(d.sCh))
        .filter((n) => Number.isFinite(n))
        .slice(-60)

      const current = weatherData?.current
      // LSTMForecast currently reads `temp_c` / `humidity` from `weatherData.current` root.
      // We mirror that to keep both pages aligned.
      const temperature = current?.temp_c || 25.0
      const humidity = current?.humidity || 70.0
      const precipitation = current?.precip_mm || 0.0

      const location = UGANDA_LOCATIONS[districtKey] || UGANDA_LOCATIONS.kampala
      const districtName = location?.name
      const districtRegion = location?.region || 'Central'

      const predictionData = {
        date: new Date().toISOString().split('T')[0],
        region: districtRegion,
        district: districtName,
        temperature,
        humidity,
        precipitation,
        historicalSuspected: historicalSuspected.length > 0 ? historicalSuspected : [],
      }

      const result = await getForecast(predictionData, 14)
      if (result && result.forecast) {
        setForecastData(result.forecast)
      } else {
        setForecastData(null)
      }
    }

    fetchForecast()
  }, [historicalData, districtKey, weatherData, getForecast])

  const spreadSummary = useMemo(() => {
    if (!forecastData || !forecastData.length) return null
    const values = forecastData
      .map((item) => Number(item?.predicted ?? item?.predicted_sCh ?? item?.predicted_sch))
      .filter((n) => Number.isFinite(n))
    if (!values.length) return null
    const total = values.reduce((a, b) => a + b, 0)
    const avgPerDay = total / values.length
    const peak = Math.max(...values)
    return { values, total, avgPerDay, peak }
  }, [forecastData])

  const showFallback =
    !spreadSummary && !apiLoading && (apiError || !modelAvailable) && fallbackSpread

  return (
    <div className="resource-hero-kpi">
      <p className="resource-hero-kpi__label">Rate of spread (AI model)</p>
      {apiLoading ? (
        <p className="resource-hero-kpi__value resource-hero-kpi__value--small">
          Calculating…
        </p>
      ) : spreadSummary ? (
        <>
          <p className="resource-hero-kpi__value">
            {spreadSummary.avgPerDay >= 0 ? '+' : ''}
            {spreadSummary.avgPerDay.toFixed(2)} cases/day
          </p>
          <p className="resource-hero-kpi__sub">
            Peak daily prediction: {spreadSummary.peak.toLocaleString(undefined, { maximumFractionDigits: 2 })} • 14-day total:{' '}
            {spreadSummary.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </>
      ) : showFallback ? (
        <>
          <p className="resource-hero-kpi__value">
            {fallbackSpread.perDay >= 0 ? '+' : ''}
            {Number(fallbackSpread.perDay).toFixed(2)} cases/day
          </p>
          <p className="resource-hero-kpi__sub">
            Fallback based on merged pipeline predictions • Window: {formatShortDate(fallbackSpread.from)} →{' '}
            {formatShortDate(fallbackSpread.to)}.
          </p>
        </>
      ) : (
        <p className="status-text">
          Prediction model isn’t available yet. Try generating from Early Warning first.
        </p>
      )}

      <label className="resource-hero-select" aria-label="Select district for spread model">
        <span className="resource-hero-select__label">District (model)</span>
        <select
          value={districtKey}
          onChange={(e) => setDistrictKey(e.target.value)}
          className="chart-select"
        >
          {districtKeys.map((k) => (
            <option key={k} value={k}>
              {UGANDA_LOCATIONS[k]?.name || k}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function ResourcePlanning({ loading, error, resourcePlanning, filteredData }) {
  const {
    priorityAreas = [],
    impactAssessment = {},
    resourceSignals = [],
    growthByRegion = [],
    latestMonthlyGrowth = null,
    recentPressurePoints = [],
    severityPerThousand = null,
    predictedSpreadPerDay = null,
  } = resourcePlanning || {}

  const [selectedGrowthRegion, setSelectedGrowthRegion] = useState('')
  const resolvedGrowthRegion = selectedGrowthRegion || growthByRegion?.[0]?.label || ''
  const selectedGrowth =
    growthByRegion.find((r) => r.label === resolvedGrowthRegion) || growthByRegion?.[0] || null

  // Render states after hooks to satisfy React Hooks rules.
  if (loading) return <p className="status-text">Loading dataset…</p>
  if (error) return <p className="status-text error">{error}</p>

  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Resource planning</p>
          <h1>Priority areas, severity, and spread signals</h1>
          <p className="lede">
            Turn outbreak dynamics into operational decisions: where pressure is rising,
            how severe the situation is per 1,000 people, and how quickly it may
            spread based on the prediction model.
          </p>
        </div>
      </motion.section>

      <section className="resource-hero-grid">
        <motion.article
          className="chart-card resource-hero-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Growth rate by region (latest month)</h3>
              <p>
                Month: <strong>{latestMonthlyGrowth?.label ?? 'N/A'}</strong>
              </p>
            </div>
            <label className="resource-hero-select" aria-label="Select region for growth">
              <span className="resource-hero-select__label">Region</span>
              <select
                value={resolvedGrowthRegion}
                onChange={(e) => setSelectedGrowthRegion(e.target.value)}
                className="chart-select"
                disabled={!growthByRegion.length}
              >
                {growthByRegion.map((r) => (
                  <option key={r.label} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedGrowth ? (
            <div className="resource-hero-kpi">
              <p className="resource-hero-kpi__label">Growth rate</p>
              <p className="resource-hero-kpi__value">{formatSignedPercent(selectedGrowth.growthRate)}</p>
              <p className="resource-hero-kpi__sub">
                Prev confirmed: {Number(selectedGrowth.prevConfirmed ?? 0).toLocaleString()} • Latest confirmed:{' '}
                {Number(selectedGrowth.lastConfirmed ?? 0).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="status-text">Not enough monthly data to compute regional growth.</p>
          )}
        </motion.article>

        <motion.article
          className="chart-card resource-hero-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Overall growth (latest month)</h3>
              <p>Confirmed case growth compared to previous month.</p>
            </div>
          </div>

          <div className="resource-hero-kpi">
            <p className="resource-hero-kpi__label">Month</p>
            <p className="resource-hero-kpi__value resource-hero-kpi__value--small">
              {latestMonthlyGrowth?.label ?? 'N/A'}
            </p>
          </div>

          {latestMonthlyGrowth ? (
            <div className="resource-hero-kpi">
              <p className="resource-hero-kpi__label">Growth rate</p>
              <p className="resource-hero-kpi__value">{formatSignedPercent(latestMonthlyGrowth.growthRate)}</p>
              <p className="resource-hero-kpi__sub">
                Delta confirmed: {Number(latestMonthlyGrowth.deltaConfirmed ?? 0).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="status-text">Not enough monthly data to compute overall growth.</p>
          )}
        </motion.article>

        <motion.article
          className="chart-card resource-hero-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Disease severity per 1,000 people</h3>
              <p>Suspected, confirmed, and deaths normalized to population.</p>
            </div>
          </div>

          {severityPerThousand ? (
            <div className="resource-severity-grid">
              <div className="resource-severity-kpi">
                <p className="resource-hero-kpi__label">Suspected / 1,000</p>
                <p className="resource-hero-kpi__value">{severityPerThousand.suspected.toFixed(2)}</p>
              </div>
              <div className="resource-severity-kpi">
                <p className="resource-hero-kpi__label">Confirmed / 1,000</p>
                <p className="resource-hero-kpi__value">{severityPerThousand.confirmed.toFixed(2)}</p>
              </div>
              <div className="resource-severity-kpi">
                <p className="resource-hero-kpi__label">Deaths / 1,000</p>
                <p className="resource-hero-kpi__value">{severityPerThousand.deaths.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="status-text">
              Population fields are missing in the payload, so severity per 1,000 cannot be computed.
            </p>
          )}
        </motion.article>

        <motion.article
          className="chart-card resource-hero-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Recent pressure points</h3>
              <p>Top districts from the most recent 30 days.</p>
            </div>
          </div>

          {recentPressurePoints?.length ? (
            <ul className="resource-pressure-list">
              {recentPressurePoints.slice(0, 4).map((p, idx) => (
                <li key={`${p.label}-${idx}`} className="resource-pressure-row">
                  <span className="resource-pressure-rank">{idx + 1}</span>
                  <div className="resource-pressure-main">
                    <p className="resource-pressure-name">{p.label}</p>
                    <p className="resource-pressure-sub">
                      Severity {Number(p.severity ?? 0).toLocaleString()} • Confirmed{' '}
                      {Number(p.confirmed ?? 0).toLocaleString()} • Deaths{' '}
                      {Number(p.deaths ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <span className="resource-pressure-val">{Number(p.suspected ?? 0).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="status-text">Not enough recent data to detect pressure points.</p>
          )}
        </motion.article>

        <motion.article
          className="chart-card resource-hero-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Current rate of spread (per day)</h3>
              <p>From the same prediction model used in Early Warning.</p>
            </div>
          </div>

          <PredictionSpreadHero
            historicalData={filteredData}
            fallbackSpread={predictedSpreadPerDay}
            candidateLabel={priorityAreas?.[0]?.label}
          />
        </motion.article>
      </section>

      <section className="resource-bottom-grid">
        <motion.section
          className="chart-card wide"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Priority area identification</h3>
            <p>Top districts sorted by severity (confirmed + deaths weighting).</p>
          </div>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Confirmed</th>
                  <th>Suspected</th>
                  <th>Deaths</th>
                  <th>Share of confirmed</th>
                </tr>
              </thead>
              <tbody>
                {priorityAreas.slice(0, 5).map((area, idx) => (
                  <tr key={area.label} className={idx === 0 ? 'priority-top-row' : undefined}>
                    <td className={idx === 0 ? 'priority-top' : undefined}>{area.label}</td>
                    <td>{Number(area.confirmed ?? 0).toLocaleString()}</td>
                    <td>{Number(area.suspected ?? 0).toLocaleString()}</td>
                    <td>{Number(area.deaths ?? 0).toLocaleString()}</td>
                    <td>{Number(area.share ?? 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Total impact (filtered window)</h3>
              <p>Suspected, confirmed, deaths, and CFR.</p>
            </div>
          </div>

          <div className="resource-impact-grid">
            <div className="resource-impact-kpi">
              <p className="resource-hero-kpi__label">Suspected</p>
              <p className="resource-hero-kpi__value">{Number(impactAssessment.totalSuspected ?? 0).toLocaleString()}</p>
            </div>
            <div className="resource-impact-kpi">
              <p className="resource-hero-kpi__label">Confirmed</p>
              <p className="resource-hero-kpi__value">{Number(impactAssessment.totalConfirmed ?? 0).toLocaleString()}</p>
            </div>
            <div className="resource-impact-kpi">
              <p className="resource-hero-kpi__label">Deaths</p>
              <p className="resource-hero-kpi__value">{Number(impactAssessment.totalDeaths ?? 0).toLocaleString()}</p>
            </div>
            <div className="resource-impact-kpi">
              <p className="resource-hero-kpi__label">CFR</p>
              <p className="resource-hero-kpi__value">{Number(impactAssessment.cfr ?? 0).toFixed(2)}%</p>
            </div>
          </div>

          {resourceSignals?.length ? (
            <>
              <div className="resource-subsection-title">High pressure regions</div>
              <ul className="resource-signals-list">
                {resourceSignals.slice(0, 5).map((signal) => (
                  <li key={signal.label} className="resource-signal-row">
                    <div className="resource-signal-left">
                      <strong>{signal.label}</strong>
                      <span>
                        Pressure {Number(signal.pressureScore ?? 0).toLocaleString()} • Positivity{' '}
                        {Number(signal.positivity ?? 0).toFixed(1)}% • Avg CFR{' '}
                        {Number(signal.avgCFR ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </motion.article>
      </section>
    </div>
  )
}

export default ResourcePlanning

