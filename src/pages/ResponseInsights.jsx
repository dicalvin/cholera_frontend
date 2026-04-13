import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Recommendation Engine ──────────────────────────────────────── */

function generateRecommendations(spreadInsights, summary) {
  const {
    outbreakThreshold = 0,
    outbreakFlags = [],
    responseIndicators = {},
    riskRegions = [],
    vulnerablePopulations = [],
    spreadSeries = [],
  } = spreadInsights || {}

  const avgCFR = responseIndicators.avgCFR ?? 0
  const avgPositivity = responseIndicators.avgPositivity ?? 0
  const avgGrowth = responseIndicators.avgGrowth ?? 0
  const flagCount = outbreakFlags.length
  const topRegion = riskRegions[0]?.label ?? 'the highest-risk region'
  const secondRegion = riskRegions[1]?.label ?? null
  const topVulnerable = vulnerablePopulations[0]?.label ?? 'the most affected district'
  const totalDeaths = summary?.totalDeaths ?? 0
  const totalConfirmed = summary?.totalConfirmed ?? 0
  const positivityRate = summary?.positivityRate ?? avgPositivity

  // Determine severity helpers
  const cfrLevel = avgCFR > 3 ? 'critical' : avgCFR > 1 ? 'warning' : 'good'
  const positivityLevel = avgPositivity > 20 ? 'critical' : avgPositivity > 10 ? 'warning' : 'good'
  const growthLevel = avgGrowth > 20 ? 'critical' : avgGrowth > 5 ? 'warning' : 'good'
  const outbreakLevel = flagCount >= 4 ? 'critical' : flagCount >= 2 ? 'warning' : 'good'

  const recs = []

  /* ── CFR-based ── */
  if (cfrLevel === 'critical') {
    recs.push({
      id: 'cfr-critical',
      severity: 'critical',
      category: 'Clinical Management',
      title: 'Activate emergency clinical protocols — CFR exceeds 3%',
      summary: `Average CFR of ${avgCFR.toFixed(2)}% is critically high. Immediate clinical intervention is required.`,
      details: [
        'Deploy additional Oral Rehydration Therapy (ORT) corners in all active treatment sites.',
        "Ensure adequate IV Ringer's lactate stock for severe dehydration cases.",
        'Fast-track triage: separate severe/moderate cases at point-of-entry.',
        'Review and enforce clinical case management protocols at all Cholera Treatment Centres (CTCs).',
        'Conduct emergency clinical audits to identify avoidable deaths and improve case outcomes.',
        'Request surge support from WHO/UNICEF for clinical staff and supplies if local capacity is insufficient.',
      ],
    })
    recs.push({
      id: 'cfr-training',
      severity: 'critical',
      category: 'Capacity Building',
      title: 'Emergency clinical staff refresher training',
      summary: 'High CFR often indicates gaps in case management. Immediate training is needed.',
      details: [
        'Organise rapid refresher trainings for health workers on WHO cholera case management guidelines.',
        'Focus on early recognition of severe dehydration and timely IV fluid administration.',
        'Deploy district focal persons to on-site coaching at CTCs with highest CFR.',
        'Ensure night-shift staff have same protocols and supervision as day shift.',
      ],
    })
  } else if (cfrLevel === 'warning') {
    recs.push({
      id: 'cfr-warning',
      severity: 'warning',
      category: 'Clinical Management',
      title: 'Review case management — CFR trending above baseline',
      summary: `CFR of ${avgCFR.toFixed(2)}% is elevated. Review treatment protocols before it worsens.`,
      details: [
        'Audit recent deaths to identify common risk factors (delayed presentation, dehydration severity).',
        'Reinforce triage and assessment procedures at all treatment centres.',
        'Ensure continuous supply of ORS sachets and IV fluids at facility and community levels.',
        'Improve referral pathways so patients reach CTCs within the golden 4-hour window.',
      ],
    })
  } else {
    recs.push({
      id: 'cfr-good',
      severity: 'good',
      category: 'Clinical Management',
      title: 'Maintain current case management standards',
      summary: `CFR of ${avgCFR.toFixed(2)}% is within acceptable range. Sustain existing protocols.`,
      details: [
        'Continue regular supervision of CTCs and oral rehydration points.',
        'Maintain ORS and IV fluid buffer stocks to prevent stock-outs.',
        'Continue weekly clinical performance reviews.',
      ],
    })
  }

  /* ── Positivity-based ── */
  if (positivityLevel === 'critical') {
    recs.push({
      id: 'positivity-critical',
      severity: 'critical',
      category: 'Surveillance & Testing',
      title: `Urgent surveillance scale-up — positivity rate at ${avgPositivity.toFixed(1)}%`,
      summary: 'Greater than 20% positivity signals severe underdetection or uncontrolled spread.',
      details: [
        'Immediately expand stool testing capacity at peripheral health units.',
        'Deploy rapid diagnostic test (RDT) kits to the 5 highest-burden districts.',
        'Activate community health worker (CHW) network for active case finding in underserved areas.',
        'Establish mobile testing units in high-density market and landing areas.',
        'Cross-check IDP settlements and informal settlements for unreported clusters.',
        'Report daily case counts to the district and national surveillance system.',
      ],
    })
    recs.push({
      id: 'active-case-finding',
      severity: 'critical',
      category: 'Active Case-Finding',
      title: 'Mobilise active case-finding teams in community',
      summary: 'High positivity means many cases are going uncounted outside health facilities.',
      details: [
        'Train and deploy CHWs to identify acute watery diarrhoea cases at household level.',
        'Establish rumour-surveillance hotlines and map all reported clusters.',
        'Coordinate with traditional healers and birth attendants to report AWD cases.',
        'Use GPS-tagged linelists to identify geographic clustering and prioritise response.',
      ],
    })
  } else if (positivityLevel === 'warning') {
    recs.push({
      id: 'positivity-warning',
      severity: 'warning',
      category: 'Surveillance & Testing',
      title: `Reinforce surveillance — positivity at ${avgPositivity.toFixed(1)}%`,
      summary: 'Positivity above 10% suggests community transmission may be underdetected.',
      details: [
        'Increase sample collection targets in hotspot sub-counties.',
        'Verify completeness of surveillance reporting from all health facilities.',
        'Strengthen zero-reporting system to confirm silent districts are truly zero.',
        'Review and update case definitions with frontline health workers.',
      ],
    })
  }

  /* ── Growth rate ── */
  if (growthLevel === 'critical') {
    recs.push({
      id: 'growth-critical',
      severity: 'critical',
      category: 'Outbreak Response',
      title: `Escalating outbreak — ${avgGrowth.toFixed(1)}% average monthly growth`,
      summary: 'Rapid case growth demands immediate multi-sector surge response activation.',
      details: [
        'Convene emergency District Health Team (DHT) meeting within 24 hours.',
        'Activate the National Rapid Response Team (RRT) for at-risk districts.',
        'Pre-position cholera kits (antibiotics, ORS, IV fluids) to all frontline facilities.',
        'Issue a public health advisory for all affected districts.',
        'Coordinate with logistics cluster for emergency commodity replenishment.',
        'Implement twice-daily situational reporting to the national EOC.',
      ],
    })
    recs.push({
      id: 'movement-surveillance',
      severity: 'critical',
      category: 'Epidemiological Investigation',
      title: 'Investigate transmission chains and movement patterns',
      summary: `Rapid growth of ${avgGrowth.toFixed(1)}% requires identifying the amplification source.`,
      details: [
        'Conduct rapid epidemiological investigation at epicentre of growth.',
        'Map water sources, market days, and mass gatherings in affected areas.',
        'Trace contacts of confirmed cases to identify secondary transmission.',
        'Collect environmental water samples from suspect sources for lab testing.',
        'Review funeral and cultural practices as potential amplification events.',
      ],
    })
  } else if (growthLevel === 'warning') {
    recs.push({
      id: 'growth-warning',
      severity: 'warning',
      category: 'Outbreak Response',
      title: `Accelerating case growth — monitor closely (${avgGrowth.toFixed(1)}%/month)`,
      summary: 'Growth rate is rising. Strengthen containment before an escalating outbreak forms.',
      details: [
        'Increase frequency of district surveillance calls to bi-weekly.',
        'Pre-position response commodities in adjacent at-risk districts.',
        'Implement enhanced environmental surveillance (water safety, sanitation mapping).',
        'Brief district health teams on outbreak escalation triggers.',
      ],
    })
  } else if (avgGrowth < 0) {
    recs.push({
      id: 'growth-declining',
      severity: 'good',
      category: 'Outbreak Control',
      title: 'Declining trend detected — maintain pressure to achieve zero transmission',
      summary: `Negative growth of ${avgGrowth.toFixed(1)}%/month indicates the response is working.`,
      details: [
        'Do not withdraw response resources prematurely — cholera rebounds quickly.',
        'Continue active surveillance for at least 2 weeks after last case.',
        'Sustain WASH improvements in affected communities to prevent recurrence.',
        'Document lessons learned and archive response data for future preparedness.',
      ],
    })
  }

  /* ── Outbreak flags ── */
  if (outbreakLevel === 'critical') {
    recs.push({
      id: 'flags-critical',
      severity: 'critical',
      category: 'Outbreak Management',
      title: `${flagCount} months exceeded outbreak threshold — sustained epidemic underway`,
      summary: `Confirmed cases exceeded the ${Math.round(outbreakThreshold).toLocaleString()} cCh threshold in ${flagCount} months.`,
      details: [
        'Escalate response classification to sustained epidemic — activate full IMS structure.',
        'Conduct thorough risk mapping covering all affected districts and sub-counties.',
        'Initiate Oral Cholera Vaccine (OCV) campaign planning in highest-burden areas.',
        'Engage community leaders, religious heads, and local media for sustained BCC messaging.',
        'Coordinate with WASH cluster for emergency water trucking and chlorination.',
        'Request international/NGO partner support if national capacity is stretched.',
      ],
    })
    recs.push({
      id: 'ocv-campaign',
      severity: 'critical',
      category: 'Preventive Campaign',
      title: 'Plan and execute Oral Cholera Vaccine (OCV) campaign',
      summary: `Sustained epidemic across ${flagCount} months indicates endemic transmission — OCV is indicated.`,
      details: [
        'Conduct OCV micro-planning: identify target population, cold chain, delivery sites.',
        `Prioritise: ${topRegion}${secondRegion ? ` and ${secondRegion}` : ''} based on current risk scoring.`,
        'Coordinate with MOH Expanded Programme on Immunisation (EPI) for logistics.',
        'Plan for reactive OCV in the epicentre and pre-emptive OCV in adjacent high-risk areas.',
        'Set up tally sheets, AEFI monitoring, and post-campaign coverage survey.',
      ],
    })
  } else if (outbreakLevel === 'warning') {
    recs.push({
      id: 'flags-warning',
      severity: 'warning',
      category: 'Outbreak Management',
      title: `${flagCount} outbreak threshold exceedances — escalation risk is high`,
      summary: 'Multiple months over threshold indicates ongoing community transmission.',
      details: [
        'Activate district-level Emergency Operations Committee (EOC).',
        'Identify and address gaps in WASH infrastructure driving sustained transmission.',
        'Evaluate OCV as a prevention tool for highest-risk sub-populations.',
        'Increase health facility readiness: stock, staff training, waste management.',
      ],
    })
  }

  /* ── Risk regions ── */
  if (topRegion && riskRegions.length > 0) {
    recs.push({
      id: 'risk-region-focus',
      severity: riskRegions[0].riskScore > 5 ? 'critical' : 'warning',
      category: 'Geographic Targeting',
      title: `Priority geographic focus: ${topRegion}`,
      summary: `${topRegion} has the highest composite risk score${secondRegion ? `, followed by ${secondRegion}` : ''}.`,
      details: [
        `Deploy additional response teams and commodities to ${topRegion}.`,
        `Conduct rapid WASH assessment in ${topRegion} to identify contamination sources.`,
        'Map and chlorinate community water points in the top 2 risk regions.',
        'Intensify health promotion and hygiene messaging in local languages.',
        secondRegion
          ? `Pre-position cholera response kits in ${secondRegion} in anticipation of spread.`
          : 'Monitor adjacent regions for cross-district spillover.',
        'Establish/strengthen coordination between district health teams in hotspot regions.',
      ].filter(Boolean),
    })
  }

  /* ── Vulnerable populations ── */
  if (vulnerablePopulations.length > 0) {
    recs.push({
      id: 'vulnerable-populations',
      severity: totalDeaths > 100 ? 'critical' : 'warning',
      category: 'Vulnerable Population Protection',
      title: `Prioritise ${topVulnerable} — highest death burden`,
      summary: `${topVulnerable} carries the greatest mortality load (${vulnerablePopulations[0]?.deaths?.toLocaleString() ?? 0} deaths).`,
      details: [
        `Immediately deploy palliative and critical care support to ${topVulnerable}.`,
        'Identify high-risk sub-groups: under-5 children, elderly, malnourished individuals.',
        'Ensure nutrition support is integrated into cholera case management protocols.',
        'Strengthen community-based oral rehydration therapy (CBO-ORT) in remote areas.',
        'Engage community health volunteers for home-based case management support.',
        'Review fatality data to identify preventable deaths and inform corrective action.',
      ],
    })
  }

  /* ── Deaths overall ── */
  if (totalDeaths > 50) {
    recs.push({
      id: 'mortality-reduction',
      severity: totalDeaths > 200 ? 'critical' : 'warning',
      category: 'Mortality Reduction',
      title: `${totalDeaths.toLocaleString()} total deaths — implement zero-mortality strategy`,
      summary: 'High cumulative deaths require systematic mortality reduction interventions.',
      details: [
        'Institute verbal/social autopsy for every reported cholera death.',
        'Identify most common delay in care-seeking (awareness, access, cost) and address it.',
        'Strengthen ambulance and referral networks especially for night presentations.',
        'Engage community leaders to reduce stigma and encourage early health-seeking.',
        'Provide free treatment at point of care to remove financial barriers.',
      ],
    })
  }

  /* ── WASH interventions ── */
  recs.push({
    id: 'wash',
    severity: positivityLevel !== 'good' || growthLevel !== 'good' ? 'warning' : 'good',
    category: 'WASH',
    title: 'Accelerate WASH interventions to break transmission cycle',
    summary: 'Cholera is fundamentally a water and sanitation disease. WASH is core to control.',
    details: [
      'Identify and rehabilitate all suspected contaminated water sources.',
      'Distribute household water treatment products (WaterGuard/chlorine tablets) in hotspots.',
      'Promote handwashing with soap at critical junctures (food prep, after latrine use).',
      'Audit open defecation rates and deploy emergency latrines in underserved settlements.',
      'Chlorinate communal water points and verify free chlorine residual (>0.2 mg/L).',
      'Coordinate with NWSC/local water authorities for emergency pipe repairs and disinfection.',
      'Target sanitation improvements at water-stressed and flood-prone areas.',
    ],
  })

  /* ── Social mobilisation ── */
  recs.push({
    id: 'social-mob',
    severity: 'warning',
    category: 'Community Engagement',
    title: 'Intensify community mobilisation and risk communication',
    summary: 'Community behaviour change is essential for breaking cholera transmission chains.',
    details: [
      'Activate community health volunteers (CHVs) in all hotspot communities.',
      'Broadcast risk communication messages via local radio, SMS, and community loudspeakers.',
      'Address myths and misconceptions about cholera, treatment, and vaccines.',
      'Engage religious and cultural leaders to promote care-seeking and hygiene practices.',
      'Set up community feedback mechanisms (hotlines, suggestion boxes) to track rumours.',
      'Conduct home visits for follow-up of discharged patients.',
    ],
  })

  /* ── Spread pattern / environmental ── */
  const recentSpread = spreadSeries.slice(-3)
  const avgExposureGap =
    recentSpread.length > 0
      ? recentSpread.reduce((s, e) => s + (e.suspected - e.confirmed), 0) / recentSpread.length
      : 0

  if (avgExposureGap > 100) {
    recs.push({
      id: 'exposure-gap',
      severity: 'warning',
      category: 'Environmental Surveillance',
      title: 'Large exposure gap — scale up environmental surveillance',
      summary: `On average ${Math.round(avgExposureGap).toLocaleString()} more suspected than confirmed cases per period — indicates wide community exposure.`,
      details: [
        'Intensify environmental water sampling at communal water points, rivers, and boreholes.',
        'Map disease hotspots against water infrastructure to identify contamination nodes.',
        'Enforce food safety standards at markets, restaurants, and street food vendors.',
        'Coordinate with meteorological authority to anticipate flood/drought risks that affect water safety.',
        'Conduct cross-sectoral meeting with agriculture, water, and education sectors to align response.',
      ],
    })
  }

  /* ── Coordination ── */
  recs.push({
    id: 'coordination',
    severity: flagCount >= 2 ? 'warning' : 'good',
    category: 'Coordination & Reporting',
    title: 'Strengthen inter-sector coordination and reporting completeness',
    summary: 'Effective cholera control requires coordinated multi-sector action and timely data.',
    details: [
      'Convene weekly multi-sector cholera coordination meeting (health, water, education, nutrition).',
      'Ensure 100% facility reporting completeness — follow up non-reporting units.',
      'Submit situation reports to national authorities on agreed schedule.',
      'Maintain up-to-date linelist with geocoded case data for response mapping.',
      'Share data with community leaders and media in accessible formats to maintain trust.',
      'Document all response activities for after-action review (AAR).',
    ],
  })

  /* ── Supply chain ── */
  recs.push({
    id: 'supply-chain',
    severity: cfrLevel === 'critical' ? 'critical' : 'warning',
    category: 'Supply Chain',
    title: 'Ensure uninterrupted supply of essential cholera commodities',
    summary: 'Stock-outs of ORS, IV fluids, and antibiotics directly contribute to deaths.',
    details: [
      'Conduct immediate stock status assessment at all CTCs and health facilities.',
      "Pre-position at least 2-week buffer stocks of ORS, Ringer's lactate, and doxycycline.",
      'Establish emergency procurement pipeline for anticipated commodity gaps.',
      'Monitor cold chain integrity for antibiotic and RDT kits.',
      'Set up daily stock reporting system from facility level to district stores.',
      'Engage NMS/UCMB for emergency resupply requests if stocks are critically low.',
    ],
  })

  /* ── Number recommendations */
  return recs.map((r, i) => ({ ...r, priority: i + 1 }))
}

/* ─── Helper components ───────────────────────────────────────────── */

const SEVERITY_CONFIG = {
  critical: {
    icon: '🔴',
    label: 'Critical',
    bg: 'rgba(220,38,38,0.12)',
    border: '#dc2626',
    text: '#dc2626',
    badgeBg: '#dc2626',
  },
  warning: {
    icon: '🟡',
    label: 'Warning',
    bg: 'rgba(245,158,11,0.12)',
    border: '#f59e0b',
    text: '#d97706',
    badgeBg: '#f59e0b',
  },
  good: {
    icon: '🟢',
    label: 'Good',
    bg: 'rgba(16,185,129,0.12)',
    border: '#10b981',
    text: '#059669',
    badgeBg: '#10b981',
  },
}

function SeverityBadge({ level }) {
  const cfg = SEVERITY_CONFIG[level] || SEVERITY_CONFIG.warning
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0.2rem 0.55rem',
        borderRadius: '999px',
        background: cfg.badgeBg,
        color: '#fff',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  )
}

function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[rec.severity] || SEVERITY_CONFIG.warning

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: '12px',
        marginBottom: '0.75rem',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.9rem 1rem',
        }}
      >
        {/* Priority number */}
        <span
          style={{
            minWidth: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: cfg.border,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.8rem',
            flexShrink: 0,
          }}
        >
          {rec.priority}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '0.3rem',
            }}
          >
            <SeverityBadge level={rec.severity} />
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted, #94a3b8)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {rec.category}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '0.95rem',
              color: cfg.text,
              lineHeight: 1.35,
            }}
          >
            {rec.title}
          </p>
          <p
            style={{
              margin: '0.3rem 0 0',
              fontSize: '0.83rem',
              color: 'var(--text-muted, #94a3b8)',
              lineHeight: 1.5,
            }}
          >
            {rec.summary}
          </p>
        </div>

        {/* Expand toggle */}
        <span
          style={{
            fontSize: '1.1rem',
            color: cfg.text,
            transition: 'transform 0.25s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          ▾
        </span>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 1rem 1rem 3.5rem',
                borderTop: `1px solid ${cfg.border}33`,
              }}
            >
              <p
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: cfg.text,
                  margin: '0.75rem 0 0.5rem',
                }}
              >
                Recommended Actions
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {rec.details.map((detail, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--text, #e2e8f0)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Risk banner ────────────────────────────────────────────────── */
function OverallRiskBanner({ responseIndicators, outbreakFlags }) {
  const { avgCFR = 0, avgPositivity = 0, avgGrowth = 0 } = responseIndicators || {}
  const flagCount = outbreakFlags?.length ?? 0

  let overallLevel = 'good'
  const reasons = []

  if (avgCFR > 3 || avgPositivity > 20 || avgGrowth > 20 || flagCount >= 4) {
    overallLevel = 'critical'
  } else if (avgCFR > 1 || avgPositivity > 10 || avgGrowth > 5 || flagCount >= 2) {
    overallLevel = 'warning'
  }

  if (avgCFR > 3) reasons.push(`CFR ${avgCFR.toFixed(2)}%`)
  if (avgPositivity > 20) reasons.push(`positivity ${avgPositivity.toFixed(1)}%`)
  if (avgGrowth > 20) reasons.push(`growth ${avgGrowth.toFixed(1)}%/mo`)
  if (flagCount >= 4) reasons.push(`${flagCount} outbreak months`)

  const cfg = SEVERITY_CONFIG[overallLevel]
  const labels = { critical: 'HIGH RISK', warning: 'ELEVATED RISK', good: 'CONTROLLED' }

  return (
    <div
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '2rem' }}>{cfg.icon}</span>
      <div>
        <p
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: '1.05rem',
            color: cfg.text,
            letterSpacing: '0.03em',
          }}
        >
          Overall Status: {labels[overallLevel]}
        </p>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
          {reasons.length > 0
            ? `Key drivers: ${reasons.join(' · ')}`
            : 'All monitored indicators are within acceptable ranges.'}
        </p>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Avg CFR', value: `${avgCFR.toFixed(2)}%`, level: avgCFR > 3 ? 'critical' : avgCFR > 1 ? 'warning' : 'good' },
          { label: 'Positivity', value: `${avgPositivity.toFixed(1)}%`, level: avgPositivity > 20 ? 'critical' : avgPositivity > 10 ? 'warning' : 'good' },
          { label: 'Growth', value: `${avgGrowth.toFixed(1)}%`, level: avgGrowth > 20 ? 'critical' : avgGrowth > 5 ? 'warning' : 'good' },
          { label: 'Outbreak Months', value: flagCount, level: flagCount >= 4 ? 'critical' : flagCount >= 2 ? 'warning' : 'good' },
        ].map(({ label, value, level }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: SEVERITY_CONFIG[level].text }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */

const TABS = ['Overview', 'Recommendations', 'Risk Analysis', 'Vulnerable Areas']

function ResponseInsights({ loading, error, spreadInsights, filteredData, summary }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [filterSeverity, setFilterSeverity] = useState('all')

  const recommendations = useMemo(
    () => generateRecommendations(spreadInsights, summary),
    [spreadInsights, summary],
  )

  const filteredRecs = useMemo(() => {
    if (filterSeverity === 'all') return recommendations
    return recommendations.filter((r) => r.severity === filterSeverity)
  }, [recommendations, filterSeverity])

  if (loading) {
    return <p className="status-text">Loading dataset…</p>
  }

  if (error) {
    return <p className="status-text error">{error}</p>
  }

  const {
    spreadSeries = [],
    outbreakThreshold = 0,
    outbreakFlags = [],
    responseIndicators = {},
    riskRegions = [],
    vulnerablePopulations = [],
  } = spreadInsights || {}

  const critCount = recommendations.filter((r) => r.severity === 'critical').length
  const warnCount = recommendations.filter((r) => r.severity === 'warning').length
  const goodCount = recommendations.filter((r) => r.severity === 'good').length

  return (
    <div className="page">
      {/* Hero */}
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Spread intelligence</p>
          <h1>Spread patterns &amp; response effectiveness</h1>
          <p className="lede">
            Diagnose how suspected (sCh) and confirmed (cCh) cases evolve, where thresholds are
            surpassed, and which actions health workers should take now.
          </p>
        </div>
      </motion.section>

      {/* Sticky risk banner */}
      <OverallRiskBanner
        responseIndicators={responseIndicators}
        outbreakFlags={outbreakFlags}
      />

      {/* Tab nav */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          background: 'var(--surface-2, rgba(255,255,255,0.05))',
          padding: '0.35rem',
          borderRadius: '12px',
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s',
              background: activeTab === tab ? 'var(--accent, #0ea5e9)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-muted, #94a3b8)',
            }}
          >
            {tab}
            {tab === 'Recommendations' && (
              <span
                style={{
                  marginLeft: '0.4rem',
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '999px',
                  padding: '0 0.4rem',
                  fontSize: '0.72rem',
                }}
              >
                {recommendations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Overview tab ── */}
        {activeTab === 'Overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <section className="grid chart-grid">
              {/* Spread pattern chart */}
              <motion.article
                className="chart-card wide"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div className="section-header">
                  <div>
                    <h3>Spread pattern analysis</h3>
                    <p>Monthly suspected vs confirmed totals with growth rate overlays.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart data={spreadSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" minTickGap={24} />
                    <YAxis yAxisId="left" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="suspected"
                      name="Suspected"
                      fill="#fde68a"
                      stroke="#f59e0b"
                      fillOpacity={0.3}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="confirmed"
                      name="Confirmed"
                      fill="#fecaca"
                      stroke="#dc2626"
                      fillOpacity={0.4}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="growthRate"
                      name="Growth rate"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.article>

              {/* Outbreak threshold */}
              <motion.article
                className="chart-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div className="section-header">
                  <div>
                    <h3>Outbreak threshold monitoring (AI‑assisted)</h3>
                    <p>
                      Monthly exceedances of the adaptive confirmed‑case threshold (
                      {outbreakThreshold.toLocaleString()} cCh).
                    </p>
                  </div>
                </div>
                <ul className="list-grid">
                  {outbreakFlags.length ? (
                    outbreakFlags.map((flag) => (
                      <li key={flag.label}>
                        <strong>{flag.label}</strong>
                        <p>
                          {flag.confirmed.toLocaleString()} cCh • Growth{' '}
                          {flag.growthRate.toFixed(1)}%
                        </p>
                      </li>
                    ))
                  ) : (
                    <li>No periods exceeded the threshold in this window.</li>
                  )}
                </ul>
              </motion.article>

              {/* Response indicators */}
              <motion.article
                className="chart-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div className="section-header">
                  <h3>Response effectiveness indicators (recent 6 months)</h3>
                </div>
                <div className="insight-cards">
                  {[
                    {
                      label: 'Avg positivity',
                      value: `${responseIndicators.avgPositivity?.toFixed(1) ?? 0}%`,
                      level:
                        (responseIndicators.avgPositivity ?? 0) > 20
                          ? 'critical'
                          : (responseIndicators.avgPositivity ?? 0) > 10
                            ? 'warning'
                            : 'good',
                    },
                    {
                      label: 'Avg CFR',
                      value: `${responseIndicators.avgCFR?.toFixed(2) ?? 0}%`,
                      level:
                        (responseIndicators.avgCFR ?? 0) > 3
                          ? 'critical'
                          : (responseIndicators.avgCFR ?? 0) > 1
                            ? 'warning'
                            : 'good',
                    },
                    {
                      label: 'Avg growth',
                      value: `${responseIndicators.avgGrowth?.toFixed(1) ?? 0}%`,
                      level:
                        (responseIndicators.avgGrowth ?? 0) > 20
                          ? 'critical'
                          : (responseIndicators.avgGrowth ?? 0) > 5
                            ? 'warning'
                            : 'good',
                    },
                  ].map(({ label, value, level }) => {
                    const cfg = SEVERITY_CONFIG[level]
                    return (
                      <div
                        key={label}
                        className="insight-card"
                        style={{ border: `1.5px solid ${cfg.border}`, background: cfg.bg }}
                      >
                        <p>{label}</p>
                        <strong style={{ color: cfg.text }}>{value}</strong>
                      </div>
                    )
                  })}
                </div>
              </motion.article>
            </section>
          </motion.div>
        )}

        {/* ── Recommendations tab ── */}
        {activeTab === 'Recommendations' && (
          <motion.div
            key="recs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Summary pills */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: `All (${recommendations.length})` },
                { key: 'critical', label: `🔴 Critical (${critCount})` },
                { key: 'warning', label: `🟡 Warning (${warnCount})` },
                { key: 'good', label: `🟢 Good (${goodCount})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterSeverity(key)}
                  style={{
                    padding: '0.35rem 0.9rem',
                    borderRadius: '999px',
                    border: `1.5px solid ${filterSeverity === key ? 'var(--accent, #0ea5e9)' : 'transparent'}`,
                    background:
                      filterSeverity === key
                        ? 'rgba(14,165,233,0.15)'
                        : 'var(--surface-2, rgba(255,255,255,0.05))',
                    color: filterSeverity === key ? 'var(--accent, #0ea5e9)' : 'var(--text-muted, #94a3b8)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '1rem' }}>
              Click any card to expand detailed action steps for health workers.
            </p>

            {filteredRecs.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </motion.div>
        )}

        {/* ── Risk Analysis tab ── */}
        {activeTab === 'Risk Analysis' && (
          <motion.div
            key="risk"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.section
              className="chart-card wide"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="section-header">
                <h3>Risk factor analysis</h3>
                <p>Regions ranked by composite risk score (CFR + positivity + case pressure).</p>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Region</th>
                      <th>Confirmed</th>
                      <th>Avg CFR</th>
                      <th>Positivity</th>
                      <th>Risk score</th>
                      <th>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskRegions.map((region, idx) => {
                      const level =
                        region.riskScore > 7
                          ? 'critical'
                          : region.riskScore > 3
                            ? 'warning'
                            : 'good'
                      const cfg = SEVERITY_CONFIG[level]
                      return (
                        <tr
                          key={region.label}
                          style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}
                        >
                          <td style={{ fontWeight: 700, color: cfg.text }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{region.label}</td>
                          <td>{region.confirmed.toLocaleString()}</td>
                          <td style={{ color: region.avgCFR > 3 ? '#dc2626' : 'inherit' }}>
                            {region.avgCFR.toFixed(2)}%
                          </td>
                          <td style={{ color: region.positivity > 20 ? '#dc2626' : 'inherit' }}>
                            {region.positivity.toFixed(1)}%
                          </td>
                          <td style={{ fontWeight: 700 }}>{region.riskScore.toFixed(2)}</td>
                          <td>
                            <SeverityBadge level={level} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </motion.div>
        )}

        {/* ── Vulnerable Areas tab ── */}
        {activeTab === 'Vulnerable Areas' && (
          <motion.div
            key="vulnerable"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.article
              className="chart-card wide"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="section-header">
                <h3>Vulnerable population analysis</h3>
                <p>Districts ranked by death burden — these require the most urgent support.</p>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))' }}>
                {vulnerablePopulations.map((district, idx) => {
                  const deathShare =
                    vulnerablePopulations[0]?.deaths > 0
                      ? (district.deaths / vulnerablePopulations[0].deaths) * 100
                      : 0
                  const level = idx === 0 ? 'critical' : idx < 3 ? 'warning' : 'good'
                  const cfg = SEVERITY_CONFIG[level]
                  return (
                    <div
                      key={district.label}
                      style={{
                        border: `1.5px solid ${cfg.border}`,
                        borderRadius: '12px',
                        padding: '1rem',
                        background: cfg.bg,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            color: cfg.text,
                            minWidth: '1.5rem',
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <strong style={{ color: cfg.text }}>{district.label}</strong>
                        <SeverityBadge level={level} />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                        <span>⚰️ {district.deaths.toLocaleString()} deaths</span>
                        <span>✅ {district.confirmed.toLocaleString()} cCh</span>
                      </div>
                      {/* Death burden bar */}
                      <div
                        style={{
                          marginTop: '0.65rem',
                          height: '6px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round(deathShare)}%`,
                            background: cfg.border,
                            borderRadius: '999px',
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {Math.round(deathShare)}% of top district deaths
                      </p>
                    </div>
                  )
                })}
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ResponseInsights
