import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts'
import { motion } from 'framer-motion'

const viewOptions = [
  { label: 'Monthly average', value: 'monthly' },
  { label: 'Yearly average', value: 'yearly' },
]

function CfrTrendChart({ series = { monthly: [], yearly: [] } }) {
  const [view, setView] = useState('monthly')
  const data = series?.[view] ?? []
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
      className="chart-card wide"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <div>
          <h3>CFR trend</h3>
          <p>Toggle between monthly or yearly averages.</p>
        </div>
        <div className="chart-controls">
          <label>
            View
            <select
              value={view}
              onChange={(event) => setView(event.target.value)}
              className="chart-select"
            >
              {viewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            ticks={ticks}
            minTickGap={0}
          />
          <YAxis
            label={{ value: 'CFR (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 'auto']}
          />
          <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
          <Line
            type="monotone"
            dataKey="cfr"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            name="Average CFR"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default CfrTrendChart


