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

function MonthlySuspectedChart({ data = [] }) {
  return (
    <motion.article
      className="chart-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h3>Monthly suspected totals</h3>
        <p>Summed suspected cases (sCh) over the selected window.</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="suspectedArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={18} />
          <YAxis />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Area
            type="monotone"
            dataKey="suspected"
            stroke="#ea580c"
            fill="url(#suspectedArea)"
            strokeWidth={2}
            name="Suspected cases"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default MonthlySuspectedChart


