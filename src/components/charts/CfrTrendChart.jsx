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
          <XAxis dataKey="label" minTickGap={view === 'monthly' ? 24 : 12} />
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


