import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  createAddon,
  createCoupon,
  createInvoice,
  createPayment,
  createPlan,
  createSubscription,
  deleteAddon,
  deleteCoupon,
  deleteInvoice,
  deletePlan,
  deleteSubscription,
  generateInvoice,
  listAddons,
  listCoupons,
  listInvoices,
  listPayments,
  listPlans,
  listSubscriptions,
  refundPayment,
  
  updateAddon,
  updateCoupon,
  updatePlan,
  updateSubscription,
  upgradeDowngrade
} from '../../api/subscriptionBillingApi'
import { fetchCompanies } from '../../api/companyManagementApi'
import { formatDate, formatDateTime } from '../../utils/dateFormat'

const submodules = new Set([
  'Subscription Plans', 'Plan Pricing', 'User Limits', 'Storage Limits', 'Plan Upgrade/Downgrade', 'Subscription History', 'Invoice Management', 'Generate Invoice', 'Payment Tracking', 'Failed Payments', 'Refund Management', 'Transaction History', 'Discount Coupons'
])

const sectionByPage = {
  'Subscription Plans': 'subscription-plans-section',
  'Plan Pricing': 'subscription-plans-section',
  'User Limits': 'subscription-plans-section',
  'Storage Limits': 'subscription-plans-section',
  'Plan Upgrade/Downgrade': 'subscription-operations-section',
  'Subscription History': 'subscription-operations-section',
  'Invoice Management': 'subscription-invoices-section',
  'Generate Invoice': 'subscription-invoices-section',
  'Payment Tracking': 'subscription-payments-section',
  'Failed Payments': 'subscription-payments-section',
  'Refund Management': 'subscription-payments-section',
  'Transaction History': 'subscription-payments-section',
  'Discount Coupons': 'subscription-coupons-section'
}

const planCols = [
  { key: 'name', label: 'Plan' },
  { key: 'type', label: 'Type' },
  { key: 'monthlyPrice', label: 'Monthly' },
  { key: 'yearlyPrice', label: 'Yearly' },
  { key: 'userLimit', label: 'Users' },
  { key: 'storageLimit', label: 'Storage(GB)' },
  { key: 'status', label: 'Status' }
]

const resetPlanForm = (type = 'standard') => ({ name: '', type, monthlyPrice: 0, yearlyPrice: 0, userLimit: 10, storageLimit: 5, features: '', status: 'active' })
const resetInvoiceForm = () => ({ companyId: '', subscriptionId: '', amount: 0, dueDate: '', couponCode: '' })
const resetPaymentForm = () => ({ companyId: '', invoiceId: '', amount: '', method: 'card', status: 'completed', transactionRef: '' })
const resetCouponForm = () => ({ code: '', discountType: 'percent', discountValue: 10, active: true, expiresAt: '' })
const resetAddonForm = () => ({ name: '', description: '', priceMonthly: 0, priceYearly: 0, active: true })
const resetSubscriptionForm = () => ({ id: '', company: '', plan: '', billingCycle: 'monthly', status: 'active' })
const subscriptionModuleRoot = '/super-admin/subscription-and-billing'

const subscriptionWorkspaceGroups = [
  {
    title: 'Plans',
    path: `${subscriptionModuleRoot}/subscription-plans`,
    items: [
      { label: 'Subscription Plans', path: `${subscriptionModuleRoot}/subscription-plans` }
    ]
  },
  {
    title: 'Lifecycle',
    path: `${subscriptionModuleRoot}/plan-upgrade-downgrade`,
    items: [
      { label: 'Plan Upgrade/Downgrade', path: `${subscriptionModuleRoot}/plan-upgrade-downgrade` },
      { label: 'Subscription History', path: `${subscriptionModuleRoot}/subscription-history` }
    ]
  },
  {
    title: 'Billing Operations',
    path: `${subscriptionModuleRoot}/invoice-management`,
    items: [
      { label: 'Invoice Management', path: `${subscriptionModuleRoot}/invoice-management` },
      { label: 'Generate Invoice', path: `${subscriptionModuleRoot}/generate-invoice` },
      { label: 'Payment Tracking', path: `${subscriptionModuleRoot}/payment-tracking` },
      { label: 'Discount Coupons', path: `${subscriptionModuleRoot}/discount-coupons` }
    ]
  }
]

function SubscriptionBillingModulePage({ page }) {
  const { pathname } = useLocation()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [search, setSearch] = useState('')
  const [planTypeTab, setPlanTypeTab] = useState('standard')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })

  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [coupons, setCoupons] = useState([])
  const [addons, setAddons] = useState([])
  const [companies, setCompanies] = useState([])

  const [planModal, setPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [planForm, setPlanForm] = useState(resetPlanForm())

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ title: 'Confirm', message: '', onConfirm: null })

  const [invoiceModal, setInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState(resetInvoiceForm())

  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState(resetPaymentForm())

  const [couponModal, setCouponModal] = useState(false)
  const [couponForm, setCouponForm] = useState(resetCouponForm())

  const [addonModal, setAddonModal] = useState(false)
  const [addonForm, setAddonForm] = useState(resetAddonForm())

  const [assignModal, setAssignModal] = useState(false)
  const [subscriptionForm, setSubscriptionForm] = useState(resetSubscriptionForm())
  const [paymentTab, setPaymentTab] = useState('all')

  const companyOptions = useMemo(
    () => (companies || []).map((c) => ({ value: c._id || c.id, label: c.companyName })),
    [companies]
  )
  const planOptions = useMemo(() => plans.map((p) => ({ value: p._id, label: p.name })), [plans])
  const activeWorkspaceGroupIndex = useMemo(() => {
    const foundIndex = subscriptionWorkspaceGroups.findIndex((group) =>
      group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    )
    return foundIndex >= 0 ? foundIndex : 0
  }, [pathname])
  const activeWorkspaceGroup = subscriptionWorkspaceGroups[activeWorkspaceGroupIndex] || subscriptionWorkspaceGroups[0]

  const toastError = (message) => setToast({ type: 'error', message })
  const toastOk = (message) => setToast({ type: 'success', message })

  const openConfirm = (title, message, onConfirm) => {
    setConfirmConfig({ title, message, onConfirm })
    setConfirmOpen(true)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const planTypeFilter = ['Subscription Plans', 'Plan Pricing', 'User Limits', 'Storage Limits'].includes(page) ? planTypeTab : 'all'
      const [pRes, sRes, iRes, payRes, cRes, aRes, companyRes] = await Promise.all([
        listPlans({ page: pagination.page, limit: pagination.limit, search, type: planTypeFilter, status: statusFilter }),
        listSubscriptions({ page: 1, limit: 500, search, status: statusFilter }),
        listInvoices({ page: 1, limit: 500, search, status: statusFilter }),
        listPayments({ page: 1, limit: 500, search, status: statusFilter }),
        listCoupons({ page: 1, limit: 500, search }),
        listAddons({ page: 1, limit: 500, search }),
        fetchCompanies({ page: 1, limit: 500, search: '', status: 'all', plan: 'all' })
      ])

      setPlans(pRes.items || [])
      setPagination(pRes.pagination || { page: 1, limit: 10, totalPages: 1 })
      setSubscriptions(sRes.items || [])
      setInvoices(iRes.items || [])
      setPayments(payRes.items || [])
      setCoupons(cRes.items || [])
      setAddons(aRes.items || [])
      setCompanies(companyRes?.items || [])
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed loading subscription & billing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, planTypeTab, statusFilter, page])

  useEffect(() => {
    if (page === 'Subscription Plans') setPlanTypeTab('standard')
  }, [page])

  useEffect(() => {
    if (page === 'Failed Payments') setPaymentTab('failed')
    else if (page === 'Refund Management') setPaymentTab('refund')
    else if (page === 'Transaction History') setPaymentTab('transactions')
    else if (page === 'Payment Tracking') setPaymentTab('all')
  }, [page])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const planRows = useMemo(() => plans.map((p) => ({ ...p, id: p._id })), [plans])

  const savePlan = async () => {
    if (!planForm.name) return toastError('Plan name is required')
    try {
      const payload = { ...planForm, features: String(planForm.features || '').split(',').map((f) => f.trim()).filter(Boolean) }
      if (selectedPlan) await updatePlan(selectedPlan._id, payload)
      else await createPlan(payload)
      toastOk('Plan saved successfully')
      setPlanModal(false)
      setSelectedPlan(null)
      setPlanForm(resetPlanForm(planTypeTab))
      loadData()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed saving plan')
    }
  }

  const saveSubscription = async () => {
    try {
      if (!subscriptionForm.company || !subscriptionForm.plan) return toastError('Company and plan are required')
      await createSubscription({
        company: subscriptionForm.company,
        plan: subscriptionForm.plan,
        billingCycle: subscriptionForm.billingCycle,
        status: subscriptionForm.status
      })
      toastOk('Subscription assigned to company')
      setAssignModal(false)
      setSubscriptionForm(resetSubscriptionForm())
      loadData()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed assigning subscription')
    }
  }

  const applyInvoiceCoupon = (amount, couponCode) => {
    if (!couponCode) return amount
    const coupon = coupons.find((item) => item.code?.toLowerCase() === couponCode.toLowerCase() && item.active)
    if (!coupon) return amount
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return amount
    if (coupon.discountType === 'flat') return Math.max(0, Number(amount) - Number(coupon.discountValue || 0))
    return Math.max(0, Number(amount) - (Number(amount) * Number(coupon.discountValue || 0)) / 100)
  }

  const saveInvoice = async (mode) => {
    try {
      if (!invoiceForm.companyId || !invoiceForm.amount || !invoiceForm.dueDate) return toastError('Company, amount, and due date are required')
      const discountedAmount = applyInvoiceCoupon(Number(invoiceForm.amount), invoiceForm.couponCode)
      if (mode === 'manual') {
        await createInvoice({
          company: invoiceForm.companyId,
          subscription: invoiceForm.subscriptionId || undefined,
          amount: discountedAmount,
          dueDate: invoiceForm.dueDate,
          invoiceNumber: `MAN-${Date.now()}`,
          status: 'pending'
        })
      } else {
        await generateInvoice({
          companyId: invoiceForm.companyId,
          subscriptionId: invoiceForm.subscriptionId || undefined,
          amount: discountedAmount,
          dueDate: invoiceForm.dueDate
        })
      }
      toastOk(invoiceForm.couponCode ? 'Invoice generated with coupon applied' : 'Invoice generated successfully')
      setInvoiceModal(false)
      setInvoiceForm(resetInvoiceForm())
      loadData()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Invoice generation failed')
    }
  }

  const savePayment = async () => {
    try {
      const amount = Number(paymentForm.amount)
      if (!paymentForm.companyId || Number.isNaN(amount)) return toastError('Company and amount are required')
      if (amount <= 0) return toastError('Amount must be greater than 0')
      await createPayment({
        company: paymentForm.companyId,
        invoice: paymentForm.invoiceId || undefined,
        amount,
        method: paymentForm.method,
        status: paymentForm.status,
        transactionRef: paymentForm.transactionRef || `TXN-${Date.now()}`
      })
      toastOk('Payment recorded successfully')
      setPaymentModal(false)
      setPaymentForm(resetPaymentForm())
      loadData()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed recording payment')
    }
  }

  const billingSummary = useMemo(() => {
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
    const totalPaidAmount = payments
      .filter((pay) => pay.status === 'completed' || pay.status === 'paid')
      .reduce((sum, pay) => sum + Number(pay.amount || 0), 0)
    return {
      activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
      pendingInvoices: invoices.filter((inv) => inv.status === 'pending').length,
      failedPayments: payments.filter((pay) => pay.status === 'failed').length,
      revenue: totalPaidAmount,
      outstanding: Math.max(0, totalInvoiceAmount - totalPaidAmount)
    }
  }, [invoices, payments, subscriptions])

  const invoiceRows = invoices.map((x) => ({
    id: x._id,
    company: x.company?.companyName || x.company || '-',
    invoiceNumber: x.invoiceNumber,
    amount: x.amount,
    dueDate: x.dueDate ? formatDate(x.dueDate) : '-',
    status: x.status
  }))
  const invoiceCols = [{ key: 'company', label: 'Company' }, { key: 'invoiceNumber', label: 'Invoice #' }, { key: 'amount', label: 'Amount' }, { key: 'dueDate', label: 'Due Date' }, { key: 'status', label: 'Status' }]

  const paymentRows = payments.map((x) => ({
    id: x._id,
    company: x.company?.companyName || x.company || '-',
    transactionRef: x.transactionRef,
    amount: x.amount,
    method: x.method,
    status: String(x.status || '').toLowerCase() === 'completed' ? 'paid' : x.status,
    createdAt: x.createdAt ? formatDateTime(x.createdAt) : '-'
  }))
  const paymentCols = [{ key: 'company', label: 'Company' }, { key: 'transactionRef', label: 'Ref' }, { key: 'amount', label: 'Amount' }, { key: 'method', label: 'Method' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Date' }]

  const couponRows = coupons.map((x) => ({
    id: x._id,
    code: x.code,
    discountType: x.discountType,
    discountValue: x.discountValue,
    status: x.active ? 'active' : 'inactive'
  }))
  const filteredCouponRows = statusFilter === 'all' ? couponRows : couponRows.filter((row) => row.status === statusFilter)
  const couponCols = [{ key: 'code', label: 'Code' }, { key: 'discountType', label: 'Type' }, { key: 'discountValue', label: 'Value' }, { key: 'status', label: 'Status' }]

  const addonRows = addons.map((x) => ({ id: x._id, name: x.name, monthly: x.priceMonthly, yearly: x.priceYearly, status: x.active ? 'active' : 'inactive' }))
  const addonCols = [{ key: 'name', label: 'Add-on' }, { key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly' }, { key: 'status', label: 'Status' }]

  const subsRows = subscriptions.map((x) => ({ id: x._id, company: x.company?.companyName || x.company || '-', plan: x.plan?.name || x.plan || '-', billingCycle: x.billingCycle, status: x.status }))
  const subsCols = [{ key: 'company', label: 'Company' }, { key: 'plan', label: 'Plan' }, { key: 'billingCycle', label: 'Cycle' }, { key: 'status', label: 'Status' }]

  const renderPlanTable = (title) => (
    <div className={`panel ${['Subscription Plans', 'Plan Limits', 'Plan Pricing'].includes(title) ? 'subscription-plans-panel' : ''} ${['PlanLimits', 'Plan Limits', 'PlanPricing', 'Plan Pricing'].includes(title) ? 'plan-pricing-panel' : ''}`}>
      <div className="panel-head"><h3>{title}</h3>{title === 'Subscription Plans' ? <Button onClick={() => { setSelectedPlan(null); setPlanForm(resetPlanForm(planTypeTab)); setPlanModal(true) }}>Create Plan</Button> : null}</div>
      {['Subscription Plans', 'Plan Limits', 'Plan Pricing'].includes(title) ? (
        <div className="tabs-row">
          {[{ key: 'standard', label: 'Subscription Plans' }].map((tab) => (
            <button key={tab.key} type="button" className={`chip-btn ${planTypeTab === tab.key ? 'active' : ''}`} onClick={() => { setPlanTypeTab(tab.key); setPagination((p) => ({ ...p, page: 1 })) }}>
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}
      {loading ? <LoadingSkeleton rows={8} /> : <DataTable columns={planCols} rows={planRows} onEdit={(row) => { const p = plans.find((x) => x._id === row.id); setSelectedPlan(p); setPlanForm({ ...p, features: (p.features || []).join(', ') }); setPlanModal(true) }} onDelete={(row) => openConfirm('Delete Plan', 'Are you sure you want to delete this subscription plan?', async () => { await deletePlan(row.id); toastOk('Plan deleted'); loadData() })} showViewAction={false} showDeleteAction={!['Plan Limits', 'Plan Pricing'].includes(title)} />}
      <div className="pagination-row">
        <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((v) => ({ ...v, page: v.page - 1 }))}>Prev</Button>
        <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
        <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((v) => ({ ...v, page: v.page + 1 }))}>Next</Button>
      </div>
    </div>
  )

  const renderSection = (activePage = page) => {
    switch (activePage) {
      case 'Subscription Plans':
      case 'Plan Pricing':
      case 'User Limits':
      case 'Storage Limits':
        return renderPlanTable(activePage === 'User Limits' || activePage === 'Storage Limits' || activePage === 'Plan Pricing' ? 'Plan Pricing' : activePage)
      case 'Plan Upgrade/Downgrade':
      case 'Subscription History':
        return <div className="panel"><div className="panel-head"><h3>{page}</h3><Button onClick={() => setAssignModal(true)}>Assign Subscription</Button></div><div className="form-grid"><FormInput label="Subscription ID" value={subscriptionForm.id} onChange={(e) => setSubscriptionForm((p) => ({ ...p, id: e.target.value }))} /><FilterDropdown label="Plan" value={subscriptionForm.plan} onChange={(v) => setSubscriptionForm((p) => ({ ...p, plan: v }))} options={[{ value: '', label: 'Select Plan' }, ...planOptions]} /><FilterDropdown label="Status" value={subscriptionForm.status} onChange={(v) => setSubscriptionForm((p) => ({ ...p, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'expired', label: 'Expired' }, { value: 'trial', label: 'Trial' }]} /><FilterDropdown label="Billing Cycle" value={subscriptionForm.billingCycle} onChange={(v) => setSubscriptionForm((p) => ({ ...p, billingCycle: v }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} /></div><div className="actions-row"><Button onClick={async () => { try { if (!subscriptionForm.id) return toastError('Subscription ID required'); await upgradeDowngrade(subscriptionForm.id, { planId: subscriptionForm.plan, billingCycle: subscriptionForm.billingCycle }); toastOk('Subscription upgraded/downgraded'); loadData() } catch (error) { toastError(error?.response?.data?.message || 'Update failed') } }}>Upgrade/Downgrade</Button><Button variant="ghost" onClick={async () => { try { if (!subscriptionForm.id) return toastError('Subscription ID required'); await updateSubscription(subscriptionForm.id, { status: subscriptionForm.status }); toastOk(`Subscription ${subscriptionForm.status}`); loadData() } catch (error) { toastError(error?.response?.data?.message || 'Status update failed') } }}>Activate/Cancel/Expire</Button></div><DataTable columns={subsCols} rows={subsRows} showViewAction={false} onEdit={(row) => { const found = subscriptions.find((item) => item._id === row.id); if (!found) return; setSubscriptionForm({ id: found._id, company: found.company?._id || found.company || '', plan: found.plan?._id || found.plan || '', billingCycle: found.billingCycle || 'monthly', status: found.status || 'active' }) }} onDelete={(row) => openConfirm('Delete Subscription', 'Delete this company subscription?', async () => { await deleteSubscription(row.id); toastOk('Subscription deleted'); loadData() })} /></div>
      case 'Invoice Management':
      case 'Generate Invoice':
        return <div className="panel"><div className="panel-head"><h3>{page}</h3><Button onClick={() => { setInvoiceForm(resetInvoiceForm()); setInvoiceModal(true) }}>New Invoice</Button></div><DataTable columns={invoiceCols} rows={invoiceRows} showViewAction={false} showEditAction={false} onDelete={(row) => openConfirm('Delete Invoice', 'Delete this invoice?', async () => { await deleteInvoice(row.id); toastOk('Invoice deleted'); loadData() })} /></div>
      case 'Payment Tracking':
      case 'Failed Payments':
      case 'Refund Management':
      case 'Transaction History': {
        const refundableRows = paymentRows.filter((x) => ['paid', 'completed'].includes(String(x.status || '').toLowerCase()))
        const tabRows = paymentTab === 'failed'
          ? paymentRows.filter((x) => String(x.status || '').toLowerCase() === 'failed')
          : paymentTab === 'refund'
            ? refundableRows
            : paymentRows
        const emptyTitle = paymentTab === 'transactions'
          ? 'No transactions yet'
          : paymentTab === 'refund'
            ? 'No refundable payments found'
            : paymentTab === 'failed'
              ? 'No failed payments found'
              : 'No payments recorded yet'
        const emptyDescription = paymentTab === 'transactions'
          ? 'Click "Record Payment" to add a transaction.'
          : paymentTab === 'refund'
            ? 'Record a completed payment first, then refund it from this tab.'
            : paymentTab === 'failed'
              ? 'Record a payment with status "Failed" or adjust filters.'
              : 'Use "Record Payment" to create your first payment record.'
        const sectionTitle = paymentTab === 'transactions'
          ? 'Transaction History'
          : paymentTab === 'refund'
            ? 'Refund Management'
            : paymentTab === 'failed'
              ? 'Failed Payments'
              : 'Payment Tracking'
        return (
          <div className="panel">
            <div className="panel-head">
              <h3>{sectionTitle}</h3>
              <Button onClick={() => { setPaymentForm(resetPaymentForm()); setPaymentModal(true) }}>Record Payment</Button>
            </div>
            <div className="tabs-row">
              {[{ key: 'all', label: 'All Payments' }, { key: 'failed', label: 'Failed Payments' }, { key: 'refund', label: 'Refund Management' }, { key: 'transactions', label: 'Transaction History' }].map((tab) => (
                <button key={tab.key} type="button" className={`chip-btn ${paymentTab === tab.key ? 'active' : ''}`} onClick={() => setPaymentTab(tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <DataTable
              columns={paymentCols}
              rows={tabRows}
              showViewAction={false}
              showEditAction={false}
              showDeleteAction={paymentTab === 'refund'}
              onDelete={async (row) => {
                try {
                  if (paymentTab !== 'refund') return
                  await refundPayment(row.id)
                  toastOk('Payment marked as refunded')
                  loadData()
                } catch (error) {
                  toastError(error?.response?.data?.message || 'Refund action failed')
                }
              }}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
            />
          </div>
        )
      }
      case 'Discount Coupons':
        return <div className="panel"><div className="panel-head"><h3>Discount Coupons</h3><Button onClick={() => { setCouponForm(resetCouponForm()); setCouponModal(true) }}>Create Coupon</Button></div><DataTable columns={couponCols} rows={filteredCouponRows} showViewAction={false} onEdit={(row) => { const c = coupons.find((x) => x._id === row.id); setCouponForm(c); setCouponModal(true) }} onDelete={(row) => openConfirm('Delete Coupon', 'Delete this discount coupon?', async () => { await deleteCoupon(row.id); toastOk('Coupon deleted'); loadData() })} /></div>
      default:
        return <EmptyState title="Sub-module not configured" />
    }
  }

  return (
    <section className="section-layout subscription-billing-page">
      <PageHeader title="Subscription & Billing" description="Single-page workspace for plans, invoices, payments, coupons, add-ons, and renewals." breadcrumb={['Super Admin', 'Subscription & Billing', page || 'Subscription Plans']} primaryActionLabel="Reload" onPrimaryAction={loadData} />
      <div className="workspace-nav subscription-workspace-nav" aria-label="Subscription category navigation">
        {subscriptionWorkspaceGroups.map((group) => (
          <NavLink
            key={group.title}
            to={group.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive || activeWorkspaceGroup.title === group.title ? 'active' : ''}`}
            data-group={group.title.toLowerCase()}
          >
            {group.title.toUpperCase()}
          </NavLink>
        ))}
      </div>
      <div className="workspace-subnav subscription-workspace-subnav" aria-label="Subscription module navigation">
        {activeWorkspaceGroup.items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive ? 'active' : ''}`}
            data-group={activeWorkspaceGroup.title.toLowerCase()}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {page === 'Subscription Plans' || !page ? (
        <div className="panel"><h3>Billing Summary</h3><div className="stats-grid"><div className="stat-card"><h4>Active Subscriptions</h4><p>{billingSummary.activeSubscriptions}</p></div><div className="stat-card"><h4>Pending Invoices</h4><p>{billingSummary.pendingInvoices}</p></div><div className="stat-card"><h4>Failed Payments</h4><p>{billingSummary.failedPayments}</p></div><div className="stat-card"><h4>Revenue</h4><p>{billingSummary.revenue}</p></div><div className="stat-card"><h4>Outstanding</h4><p>{billingSummary.outstanding}</p></div></div></div>
      ) : null}
      <div className="panel filters-panel"><div className="filters-row"><div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search by name/code/invoice" /></div><FilterDropdown label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPagination((prev) => ({ ...prev, page: 1 })) }} options={page === 'Discount Coupons' ? [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] : [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }, { value: 'completed', label: 'Completed' }, { value: 'paid', label: 'Paid' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'expired', label: 'Expired' }]} /></div></div>
      {submodules.has(page) || !page ? renderSection(page || 'Subscription Plans') : <EmptyState title="Unknown Subscription module" />}

      <Modal open={planModal} title={selectedPlan ? 'Edit Plan' : 'Create Plan'} onClose={() => setPlanModal(false)}>
        <div className="form-grid">
          <FormInput label="Plan Name" value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} />
          <FilterDropdown label="Type" value={planForm.type} onChange={(v) => setPlanForm((p) => ({ ...p, type: v }))} options={[{ value: 'standard', label: 'Standard' }]} />
          <FormInput label="Monthly Price" type="number" value={planForm.monthlyPrice} onChange={(e) => setPlanForm((p) => ({ ...p, monthlyPrice: Number(e.target.value) }))} />
          <FormInput label="Yearly Price" type="number" value={planForm.yearlyPrice} onChange={(e) => setPlanForm((p) => ({ ...p, yearlyPrice: Number(e.target.value) }))} />
          <FormInput label="User Limit" type="number" value={planForm.userLimit} onChange={(e) => setPlanForm((p) => ({ ...p, userLimit: Number(e.target.value) }))} />
          <FormInput label="Storage Limit" type="number" value={planForm.storageLimit} onChange={(e) => setPlanForm((p) => ({ ...p, storageLimit: Number(e.target.value) }))} />
          <FormInput label="Features (comma separated)" value={planForm.features} onChange={(e) => setPlanForm((p) => ({ ...p, features: e.target.value }))} />
          <FilterDropdown label="Status" value={planForm.status} onChange={(v) => setPlanForm((p) => ({ ...p, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setPlanModal(false)}>Cancel</Button><Button onClick={savePlan}>Save Plan</Button></div>
      </Modal>

      <Modal open={assignModal} title="Assign Subscription" onClose={() => setAssignModal(false)}>
        <div className="form-grid">
          <FilterDropdown label="Company" value={subscriptionForm.company} onChange={(v) => setSubscriptionForm((p) => ({ ...p, company: v }))} options={[{ value: '', label: 'Select Company' }, ...companyOptions]} />
          <FilterDropdown label="Plan" value={subscriptionForm.plan} onChange={(v) => setSubscriptionForm((p) => ({ ...p, plan: v }))} options={[{ value: '', label: 'Select Plan' }, ...planOptions]} />
          <FilterDropdown label="Billing Cycle" value={subscriptionForm.billingCycle} onChange={(v) => setSubscriptionForm((p) => ({ ...p, billingCycle: v }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />
          <FilterDropdown label="Status" value={subscriptionForm.status} onChange={(v) => setSubscriptionForm((p) => ({ ...p, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'trial', label: 'Trial' }]} />
        </div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setAssignModal(false)}>Cancel</Button><Button onClick={saveSubscription}>Assign</Button></div>
      </Modal>

      <Modal open={invoiceModal} title="Generate Invoice" onClose={() => setInvoiceModal(false)}>
        <div className="form-grid">
          <FilterDropdown label="Company" value={invoiceForm.companyId} onChange={(v) => setInvoiceForm((p) => ({ ...p, companyId: v }))} options={[{ value: '', label: 'Select Company' }, ...companyOptions]} />
          <FilterDropdown label="Subscription" value={invoiceForm.subscriptionId} onChange={(v) => setInvoiceForm((p) => ({ ...p, subscriptionId: v }))} options={[{ value: '', label: 'Optional Subscription' }, ...subscriptions.filter((s) => !invoiceForm.companyId || (s.company?._id || s.company) === invoiceForm.companyId).map((s) => ({ value: s._id, label: `${s.plan?.name || s.plan || 'Plan'} (${s.status})` }))]} />
          <FormInput label="Amount" type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: Number(e.target.value) }))} />
          <FormInput label="Due Date" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))} />
          <FilterDropdown label="Coupon" value={invoiceForm.couponCode} onChange={(v) => setInvoiceForm((p) => ({ ...p, couponCode: v }))} options={[{ value: '', label: 'No Coupon' }, ...coupons.filter((c) => c.active).map((c) => ({ value: c.code, label: c.code }))]} />
        </div>
        <div className="actions-row"><Button onClick={() => saveInvoice('auto')}>Generate</Button><Button variant="ghost" onClick={() => saveInvoice('manual')}>Create Manual</Button></div>
      </Modal>

      <Modal open={paymentModal} title="Record Payment" onClose={() => setPaymentModal(false)}>
        <div className="form-grid">
          <FilterDropdown label="Company" value={paymentForm.companyId} onChange={(v) => setPaymentForm((p) => ({ ...p, companyId: v }))} options={[{ value: '', label: 'Select Company' }, ...companyOptions]} />
          <FilterDropdown label="Invoice" value={paymentForm.invoiceId} onChange={(v) => setPaymentForm((p) => ({ ...p, invoiceId: v }))} options={[{ value: '', label: 'Optional Invoice' }, ...invoices.filter((inv) => !paymentForm.companyId || (inv.company?._id || inv.company) === paymentForm.companyId).map((inv) => ({ value: inv._id, label: `${inv.invoiceNumber} - ${inv.amount}` }))]} />
          <FormInput label="Amount" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} />
          <FilterDropdown label="Method" value={paymentForm.method} onChange={(v) => setPaymentForm((p) => ({ ...p, method: v }))} options={[{ value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'upi', label: 'UPI' }, { value: 'cash', label: 'Cash' }]} />
          <FilterDropdown label="Status" value={paymentForm.status} onChange={(v) => setPaymentForm((p) => ({ ...p, status: v }))} options={[{ value: 'completed', label: 'Completed' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }]} />
          <FormInput label="Transaction Ref" value={paymentForm.transactionRef} onChange={(e) => setPaymentForm((p) => ({ ...p, transactionRef: e.target.value }))} />
        </div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setPaymentModal(false)}>Cancel</Button><Button onClick={savePayment}>Record</Button></div>
      </Modal>

      <Modal open={couponModal} title="Coupon" onClose={() => setCouponModal(false)}>
        <div className="form-grid">
          <FormInput label="Code" value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value }))} />
          <FilterDropdown label="Discount Type" value={couponForm.discountType} onChange={(v) => setCouponForm((p) => ({ ...p, discountType: v }))} options={[{ value: 'percent', label: 'Percent' }, { value: 'flat', label: 'Flat' }]} />
          <FormInput label="Discount Value" type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: Number(e.target.value) }))} />
          <FormInput label="Expires At" type="date" value={couponForm.expiresAt?.slice?.(0, 10) || ''} onChange={(e) => setCouponForm((p) => ({ ...p, expiresAt: e.target.value }))} />
          <FilterDropdown label="Status" value={couponForm.active ? 'active' : 'inactive'} onChange={(v) => setCouponForm((p) => ({ ...p, active: v === 'active' }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </div>
        <div className="actions-row"><Button onClick={async () => { try { if (!couponForm.code) return toastError('Coupon code is required'); const payload = { ...couponForm, code: String(couponForm.code).trim().toUpperCase() }; if (payload._id) await updateCoupon(payload._id, payload); else await createCoupon(payload); toastOk('Coupon saved'); setCouponModal(false); loadData() } catch (error) { toastError(error?.response?.data?.message || 'Coupon save failed') } }}>Save Coupon</Button></div>
      </Modal>

      <Modal open={addonModal} title="Add-on Service" onClose={() => setAddonModal(false)}>
        <div className="form-grid">
          <FormInput label="Name" value={addonForm.name} onChange={(e) => setAddonForm((p) => ({ ...p, name: e.target.value }))} />
          <FormInput label="Description" value={addonForm.description} onChange={(e) => setAddonForm((p) => ({ ...p, description: e.target.value }))} />
          <FormInput label="Monthly Price" type="number" value={addonForm.priceMonthly} onChange={(e) => setAddonForm((p) => ({ ...p, priceMonthly: Number(e.target.value) }))} />
          <FormInput label="Yearly Price" type="number" value={addonForm.priceYearly} onChange={(e) => setAddonForm((p) => ({ ...p, priceYearly: Number(e.target.value) }))} />
        </div>
        <div className="actions-row"><Button onClick={async () => { try { if (!addonForm.name) return toastError('Add-on name is required'); if (addonForm._id) await updateAddon(addonForm._id, addonForm); else await createAddon(addonForm); toastOk('Add-on saved'); setAddonModal(false); loadData() } catch (error) { toastError(error?.response?.data?.message || 'Add-on save failed') } }}>Save Add-on</Button></div>
      </Modal>

      <ConfirmDialog open={confirmOpen} title={confirmConfig.title} message={confirmConfig.message} onCancel={() => setConfirmOpen(false)} onConfirm={async () => { try { await confirmConfig.onConfirm?.() } catch (error) { toastError(error?.response?.data?.message || 'Action failed') } finally { setConfirmOpen(false) } }} />
    </section>
  )
}

export default SubscriptionBillingModulePage
