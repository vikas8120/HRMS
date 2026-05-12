export const modules = [
  'AI Dashboard',
  'AI Attendance Insights',
  'AI Attrition Prediction',
  'AI Payroll Analytics',
  'AI Recruitment Scoring',
  'AI Chatbot',
  'AI Leave Prediction',
  'AI Employee Sentiment',
  'AI Auto Reports',
  'AI Fraud Detection',
  'AI Performance Insights',
  'AI Recommendations',
  'AI Model Training',
  'AI Usage Analytics',
  'AI Automation Rules'
]

export function buildModuleData(name) {
  return {
    name,
    description: `${name} module overview, KPIs, and AI-driven recommendations for HR leadership.`,
    status: 'Active',
    lastRun: new Date().toISOString(),
    owner: 'HR Analytics Team'
  }
}
