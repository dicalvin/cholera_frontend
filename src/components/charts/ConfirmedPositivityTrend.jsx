import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'

const viewOptions = [
  { value: 'monthly', label: 'Monthly sums' },
  { value: 'yearly', label: 'Yearly sums' },
]

const percentageFormatter = (value) => `${value.toFixed(1)}%`

function ConfirmedPositivityTrend({ series = { monthly: [], yearly: [] } }) {
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
          <h3>Confirmed cases & positivity</h3>
          <p>Track how confirmed cases move with the testing positivity rate.</p>
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
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={view === 'monthly' ? 24 : 12} />
          <YAxis
            yAxisId="left"
            label={{ value: 'Confirmed cases', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
            }
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Positivity (%)', angle: 90, position: 'insideRight' }}
            tickFormatter={percentageFormatter}
            domain={[0, (dataMax) => Math.max(10, Math.ceil(dataMax))]}
          />
          <Tooltip
            formatter={(value, name) =>
              name === 'Positivity rate'
                ? percentageFormatter(Number(value))
                : value.toLocaleString()
            }
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="confirmed"
            stroke="#dc2626"
            strokeWidth={2.4}
            dot={{ r: 3 }}
            name="Confirmed cases"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="positivity"
            stroke="#0ea5e9"
            strokeDasharray="4 4"
            strokeWidth={2.4}
            dot={{ r: 3 }}
            name="Positivity rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default ConfirmedPositivityTrend


