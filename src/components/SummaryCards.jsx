import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

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
  const [animatedValues, setAnimatedValues] = useState({
    totalSuspected: 0,
    totalConfirmed: 0,
    totalDeaths: 0,
    avgCFR: 0,
    positivityRate: 0,
  })

  useEffect(() => {
    let rafId
    const start = performance.now()
    const duration = 900
    const from = animatedValues
    const target = {
      totalSuspected: Number(summary.totalSuspected || 0),
      totalConfirmed: Number(summary.totalConfirmed || 0),
      totalDeaths: Number(summary.totalDeaths || 0),
      avgCFR: Number(summary.avgCFR || 0),
      positivityRate: Number(summary.positivityRate || 0),
    }

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setAnimatedValues({
        totalSuspected: from.totalSuspected + (target.totalSuspected - from.totalSuspected) * eased,
        totalConfirmed: from.totalConfirmed + (target.totalConfirmed - from.totalConfirmed) * eased,
        totalDeaths: from.totalDeaths + (target.totalDeaths - from.totalDeaths) * eased,
        avgCFR: from.avgCFR + (target.avgCFR - from.avgCFR) * eased,
        positivityRate: from.positivityRate + (target.positivityRate - from.positivityRate) * eased,
      })
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    summary.totalSuspected,
    summary.totalConfirmed,
    summary.totalDeaths,
    summary.avgCFR,
    summary.positivityRate,
  ])

  return (
    <section className="grid stats-grid">
      {metrics.map((metric, index) => {
        const value = animatedValues[metric.key] || 0
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


