import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  { key: 'regions', label: 'Regions' },
  { key: 'years', label: 'Years' },
  { key: 'topDistricts', label: 'Top districts' },
]

const tabMeta = {
  regions: {
    segmentLabel: 'Region',
    description: 'Regional share of the selected metric within the active window.',
  },
  years: {
    segmentLabel: 'Year',
    description: 'Year-over-year distribution across the filtered timeline.',
  },
  topDistricts: {
    segmentLabel: 'District',
    description: 'Most impacted districts ranked by severity of the selected metric.',
  },
}

const metricFocusMap = {
  totalSuspected: { key: 'suspected', label: 'Suspected (sCh)', isRate: false },
  totalConfirmed: { key: 'confirmed', label: 'Confirmed (cCh)', isRate: false },
  totalDeaths: { key: 'deaths', label: 'Reported deaths', isRate: false },
  avgCFR: { key: 'avgCFR', label: 'Average CFR', isRate: true, decimals: 2, suffix: '%' },
  positivityRate: {
    key: 'positivity',
    label: 'Positivity rate',
    isRate: true,
    decimals: 1,
    suffix: '%',
  },
}

const formatNumber = (value, options) =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: 0, ...options })
    : '0'

function MetricBreakdownModal({ metric, summary, breakdowns, onClose }) {
  const [activeTab, setActiveTab] = useState('regions')
  const metricValue = summary?.[metric?.key] ?? 0
  const formattedValue = metric?.formattedValue
  const entries = breakdowns?.[activeTab] ?? []
  const tabConfig = tabMeta[activeTab] || tabMeta.regions
  const focusConfig =
    metricFocusMap[metric?.key] ?? metricFocusMap.totalConfirmed
  const metricTotal = !focusConfig.isRate ? metricValue : null
  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    focusValue: entry[focusConfig.key] || 0,
    share:
      !focusConfig.isRate && metricTotal > 0
        ? (entry[focusConfig.key] / metricTotal) * 100
        : null,
  }))

  const columns = useMemo(() => {
    const cols = [
      { key: 'label', label: `Segment (${tabConfig.segmentLabel})` },
      {
        key: 'focusValue',
        label: focusConfig.label,
        format: (value) =>
          focusConfig.isRate
            ? `${value.toFixed(focusConfig.decimals ?? 2)}${
                focusConfig.suffix ?? '%'
              }`
            : formatNumber(value),
        className: 'focus-cell',
      },
    ]
    if (!focusConfig.isRate) {
      cols.push({
        key: 'share',
        label: 'Share',
        format: (value) =>
          Number.isFinite(value) ? `${value.toFixed(1)}%` : '—',
      })
    }
    return cols.concat([
      {
        key: 'reports',
        label: 'Reports',
        format: (value) => formatNumber(value),
      },
      {
        key: 'avgCFR',
        label: 'Avg CFR',
        format: (value) => `${value.toFixed(2)}%`,
      },
      {
        key: 'positivity',
        label: 'Positivity',
        format: (value) => `${value.toFixed(1)}%`,
      },
    ])
  }, [focusConfig, tabConfig])

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-card glass"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <header className="modal-header">
            <div>
              <p className="eyebrow">{metric?.label}</p>
              <h3>{formattedValue ?? formatNumber(metricValue)}</h3>
              <p className="modal-subtitle">
                {focusConfig.label} across {tabConfig.segmentLabel.toLowerCase()}s
              </p>
            </div>
            <button type="button" className="modal-close" onClick={onClose}>
              Close
            </button>
          </header>
          <div className="modal-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={tab.key === activeTab ? 'active' : ''}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="modal-description">{tabConfig.description}</p>
          <div className="modal-table-wrapper">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrichedEntries.length > 0 ? (
                  enrichedEntries.map((entry) => (
                    <tr key={entry.label}>
                      {columns.map((column) => {
                        const value = entry[column.key]
                        const formatted =
                          column.format?.(value) ?? formatNumber(value)
                        const className = column.className ?? ''
                        return (
                          <td key={column.key} className={className}>
                            {formatted}
                            {column.key === 'label' && entry.reports ? (
                              <span className="muted">
                                {entry.reports.toLocaleString()} reports
                              </span>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                      No data available for this segment in the selected time range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MetricBreakdownModal
