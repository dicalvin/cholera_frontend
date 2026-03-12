import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts'
import { motion } from 'framer-motion'

function RegionDistributionChart({ data = [] }) {
  return (
    <motion.article
      className="chart-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h3>Regional confirmed cases</h3>
        <p>Unknown regions removed for clarity.</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 24, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="region" width={110} />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Bar
            dataKey="confirmed"
            fill="#b91c1c"
            radius={[0, 12, 12, 0]}
            name="Confirmed cases"
          >
            <LabelList
              dataKey="confirmed"
              position="right"
              formatter={(value) => value.toLocaleString()}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default RegionDistributionChart


