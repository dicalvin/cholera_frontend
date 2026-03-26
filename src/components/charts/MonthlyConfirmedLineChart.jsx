import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'

function MonthlyConfirmedLineChart({ data = [] }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `confirmedArea-${uid}`
  const ticks = (() => {
    const n = data.length
    if (!n) return []
    const idx = new Set([0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1])
    return Array.from(idx)
      .map((i) => data[i]?.label)
      .filter((v) => Boolean(v))
  })()

  return (
    <motion.article
      className="chart-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h3>Monthly confirmed cases</h3>
        <p>Positive (confirmed) case counts aggregated by month.</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" ticks={ticks} minTickGap={0} />
          <YAxis />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Area
            type="monotone"
            dataKey="confirmed"
            stroke="#b91c1c"
            fill={`url(#${gradId})`}
            strokeWidth={2}
            name="Confirmed cases"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default MonthlyConfirmedLineChart
