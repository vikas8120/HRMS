import { getRevenueAnalyticsSummary, listRevenueAnalytics, syncRevenueAnalytics } from './revenueAnalytics.service.js'

export const listRevenueAnalyticsHandler = async (req, res, next) => {
  try {
    res.json(await listRevenueAnalytics(req.query))
  } catch (error) {
    next(error)
  }
}

export const getRevenueAnalyticsSummaryHandler = async (req, res, next) => {
  try {
    res.json(await getRevenueAnalyticsSummary())
  } catch (error) {
    next(error)
  }
}

export const refreshRevenueAnalyticsHandler = async (req, res, next) => {
  try {
    await syncRevenueAnalytics()
    res.json({ message: 'Revenue analytics refreshed successfully' })
  } catch (error) {
    next(error)
  }
}
