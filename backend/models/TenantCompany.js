import { createCompatModel } from '../config/pgCompat.js'

const TenantCompany = createCompatModel('TenantCompany', { defaults: () => ({ industry: '', email: '', phone: '', address: '', city: '', state: '', country: '', timezone: '', currency: '', gst: '', pan: '', plan: 'Starter', employeeLimit: 50, employees: 0, storageLimit: 5, status: 'active', branding: { logoUrl: '', primaryColor: '#0f766e', secondaryColor: '#115e59', customDomain: '', loginPageBranding: '' }, domainSetup: { customDomain: '', verified: false, sslStatus: 'pending' }, storageUsage: { usedStorage: 0, documentsCount: 0, backupSize: 0 }, branches: [], configuration: { allowSelfOnboarding: false, allowGeoTracking: false, autoBackup: true }, suspensionReason: '', activityLogs: [] }), virtuals: { nameFromCompanyName: true } })

export default TenantCompany
