import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import SummaryCards from '../components/SummaryCards'
import MetricBreakdownModal from '../components/MetricBreakdownModal'
import MonthlySuspectedChart from '../components/charts/MonthlySuspectedChart'
import MonthlyConfirmedLineChart from '../components/charts/MonthlyConfirmedLineChart'

const PIE_PALETTE = [
  '#1d4ed8',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
]

const WESTERN_BROWN = '#92400e'

function regionPieColor(regionName, index) {
  const r = (regionName || '').trim().toLowerCase()
  if (r === 'western') return WESTERN_BROWN
  return PIE_PALETTE[index % PIE_PALETTE.length]
}

function Overview({
  loading,
  error,
  insights,
  summary,
  breakdowns,
  regionDistribution,
  regionSuspectedDistribution = [],
  monthlySuspected,
  monthlyConfirmedTrend = [],
  topDistrictsBySuspected,
  allDistrictsBySuspected = [],
}) {
  const [activeMetric, setActiveMetric] = useState(null)
  const [fullscreenGraph, setFullscreenGraph] = useState(null)
  const [moreDistrictsOpen, setMoreDistrictsOpen] = useState(false)

  const restDistricts = useMemo(
    () => (allDistrictsBySuspected?.length > 6 ? allDistrictsBySuspected.slice(6) : []),
    [allDistrictsBySuspected],
  )

  useEffect(() => {
    if (!moreDistrictsOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreDistrictsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreDistrictsOpen])

  const graphRegistry = useMemo(
    () => ({
      suspected: <MonthlySuspectedChart data={monthlySuspected} />,
      confirmedLine: (
        <MonthlyConfirmedLineChart data={monthlyConfirmedTrend} />
      ),
      regionConfirmed: (
        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Regional distribution — confirmed</h3>
            <p>Share of confirmed burden by region (2011 onwards).</p>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={regionDistribution}
                dataKey="confirmed"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={110}
                labelLine={false}
                label={({ region, percent }) =>
                  `${region} ${(percent * 100).toFixed(0)}%`
                }
              >
                {regionDistribution.map((entry, index) => (
                  <Cell
                    key={`${entry.region}-${index}`}
                    fill={regionPieColor(entry.region, index)}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value).toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.article>
      ),
      regionSuspected: (
        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Regional distribution — suspected</h3>
            <p>Share of suspected cases (sCh) by region (2011 onwards).</p>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={regionSuspectedDistribution}
                dataKey="suspected"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={110}
                labelLine={false}
                label={({ region, percent }) =>
                  `${region} ${(percent * 100).toFixed(0)}%`
                }
              >
                {regionSuspectedDistribution.map((entry, index) => (
                  <Cell
                    key={`s-${entry.region}-${index}`}
                    fill={regionPieColor(entry.region, index)}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value).toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.article>
      ),
    }),
    [
      monthlySuspected,
      monthlyConfirmedTrend,
      regionDistribution,
      regionSuspectedDistribution,
    ],
  )

  const graphPanelKeys = [
    'suspected',
    'confirmedLine',
    'regionConfirmed',
    'regionSuspected',
  ]

  return (
    <div className="page">
      {loading && <p className="status-text">Loading dataset…</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <>
          <SummaryCards summary={summary} onMetricSelect={setActiveMetric} />

          <section className="overview-graphs-grid overview-graphs-grid--quad">
            {graphPanelKeys.map((key) => (
              <div key={key} className="overview-graph-panel">
                <button
                  type="button"
                  className="graph-fullscreen-btn"
                  onClick={() => setFullscreenGraph(key)}
                >
                  Fullscreen
                </button>
                {graphRegistry[key]}
              </div>
            ))}
          </section>

          <motion.section
            className="chart-card overview-top-districts-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="section-header overview-top-districts-header">
              <div>
                <h3>Top 6 districts by suspected cases</h3>
                <p>Ranked counts from 2011 onward.</p>
              </div>
              {restDistricts.length > 0 && (
                <button
                  type="button"
                  className="overview-more-districts-btn"
                  onClick={() => setMoreDistrictsOpen(true)}
                >
                  More
                </button>
              )}
            </div>
            <div className="top-districts-list">
              {topDistrictsBySuspected?.length ? (
                topDistrictsBySuspected.map((d, i) => (
                  <div key={`${d.label}-${i}`} className="top-district-row">
                    <span className="top-district-rank">{i + 1}</span>
                    <span className="top-district-name">{d.label}</span>
                    <strong className="top-district-value">
                      {Number(d.suspected || 0).toLocaleString()}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="status-text">No district data available.</p>
              )}
            </div>
          </motion.section>

          <motion.section
            className="insights"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2>Key takeaways</h2>
            <ul>
              {insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.section>
          {activeMetric && (
            <MetricBreakdownModal
              metric={activeMetric}
              summary={summary}
              breakdowns={breakdowns}
              onClose={() => setActiveMetric(null)}
            />
          )}

          {moreDistrictsOpen && (
            <div
              className="district-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Other districts by suspected cases"
              onClick={() => setMoreDistrictsOpen(false)}
            >
              <div
                className="district-modal"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <div className="district-modal__head">
                  <h3>Other districts</h3>
                  <button
                    type="button"
                    className="district-modal__close"
                    onClick={() => setMoreDistrictsOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <p className="district-modal__sub">
                  Districts ranked 7 and below by suspected cases (2011 onward).
                </p>
                <ul className="district-modal__list">
                  {restDistricts.map((d, i) => (
                    <li key={`${d.label}-${i + 7}`} className="district-modal__row">
                      <span className="district-modal__rank">{i + 7}</span>
                      <span className="district-modal__name">{d.label}</span>
                      <span className="district-modal__val">
                        {Number(d.suspected || 0).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {fullscreenGraph && (
            <div
              className="graph-fullscreen-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Graph fullscreen view"
            >
              <div className="graph-fullscreen-inner">
                <div className="graph-fullscreen-actions">
                  <button
                    type="button"
                    className="graph-fullscreen-close"
                    onClick={() => setFullscreenGraph(null)}
                  >
                    Close fullscreen
                  </button>
                </div>
                {graphRegistry[fullscreenGraph]}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Overview
