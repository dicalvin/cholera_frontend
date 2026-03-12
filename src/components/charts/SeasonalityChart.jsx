import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from 'recharts'
import { motion } from 'framer-motion'

function SeasonalityChart({ data = [] }) {
  return (
    <motion.article
      className="chart-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h3>Seasonality profile</h3>
        <p>Average monthly suspected vs confirmed cases across all years.</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 12, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
          <Legend />
          <Bar
            dataKey="avgConfirmed"
            name="Avg confirmed"
            fill="#dc2626"
            radius={[6, 6, 0, 0]}
            opacity={0.85}
          />
          <Line
            type="monotone"
            dataKey="avgSuspected"
            name="Avg suspected"
            stroke="#475569"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default SeasonalityChart


