import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
}

const metrics = [
  { key: 'totalSuspected', label: 'Suspected cases', accent: 'amber' },
  { key: 'totalConfirmed', label: 'Confirmed cases', accent: 'emerald' },
  { key: 'totalDeaths', label: 'Reported deaths', accent: 'rose' },
  {
    key: 'avgCFR',
    label: 'Average CFR',
    accent: 'indigo',
    format: (v) => `${v.toFixed(2)}%`,
  },
  {
    key: 'positivityRate',
    label: 'Positivity rate',
    accent: 'rose',
    format: (v) => `${v.toFixed(1)}%`,
  },
]

const accentMap = {
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#fb7185',
  indigo: '#6366f1',
}

function SummaryCards({ summary, onMetricSelect }) {
  return (
    <section className="grid stats-grid">
      {metrics.map((metric, index) => {
        const value = summary[metric.key] || 0
        const formatted =
          metric.format?.(value) ??
          value.toLocaleString(undefined, { maximumFractionDigits: 0 })
        const handleClick = () => {
          onMetricSelect?.({
            key: metric.key,
            label: metric.label,
            accent: accentMap[metric.accent],
            rawValue: value,
            formattedValue: formatted,
          })
        }
        return (
          <motion.button
            type="button"
            key={metric.key}
            className="stat-card"
            style={{ borderTopColor: accentMap[metric.accent] }}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            onClick={handleClick}
          >
            <p className="stat-label">{metric.label}</p>
            <p className="stat-value">{formatted}</p>
          </motion.button>
        )
      })}
    </section>
  )
}

export default SummaryCards


