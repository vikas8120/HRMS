import { useEffect, useMemo, useState } from 'react'
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
  deletePlan,
  generateInvoice,
  listAddons,
  listCoupons,
  listInvoices,
  listPayments,
  listPlans,
  listSubscriptions,
  refundPayment,
  setAutoRenewal,
  updateAddon,
  updateCoupon,
  updatePlan,
  updateSubscription,
  upgradeDowngrade
} from '../../api/subscriptionBillingApi'
import { fetchCompanies } from '../../api/companyManagementApi'

const submodules = new Set([
  'Subscription Plans','Feature Mapping','Trial Plans','Enterprise Plan','Plan Limits','Plan Pricing','User Limits','Storage Limits','Add-on Services','Plan Upgrade/Downgrade','Auto Renewal','Subscription History','Invoice Management','Generate Invoice','Payment Tracking','Failed Payments','Refund Management','Transaction History','Discount Coupons'
])

const sectionByPage = {
  'Subscription Plans': 'subscription-plans-section',
  'Feature Mapping': 'subscription-plans-section',
  'Plan Limits': 'subscription-plans-section',
  'Trial Plans': 'subscription-plans-section',
  'Enterprise Plan': 'subscription-plans-section',
  'Plan Pricing': 'subscription-plans-section',
  'User Limits': 'subscription-plans-section',
  'Storage Limits': 'subscription-plans-section',
  'Add-on Services': 'subscription-addons-section',
  'Plan Upgrade/Downgrade': 'subscription-operations-section',
  'Auto Renewal': 'subscription-operations-section',
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

function SubscriptionBillingModulePage({ page }) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [search, setSearch] = useState('')
  const [planTypeTab, setPlanTypeTab] = useState('standard')
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
  const [planForm, setPlanForm] = useState({ name: '', type: 'standard', monthlyPrice: 0, yearlyPrice: 0, userLimit: 10, storageLimit: 5, features: '', status: 'active', autoRenewalEnabled: true })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState('')

  const [invoiceModal, setInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({ company: '', amount: 0, dueDate: '' })

  const [couponModal, setCouponModal] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: 10, active: true, expiresAt: '' })

  const [addonModal, setAddonModal] = useState(false)
  const [addonForm, setAddonForm] = useState({ name: '', description: '', priceMonthly: 0, priceYearly: 0, active: true })

  const [subscriptionForm, setSubscriptionForm] = useState({ company: '', plan: '', billingCycle: 'monthly', status: 'active', autoRenewal: true })

  const toastError = (message) => setToast({ type: 'error', message })
  const toastOk = (message) => setToast({ type: 'success', message })

  const loadData = async () => {
    setLoading(true)
    try {
      const planTypeFilter = ['Subscription Plans', 'Feature Mapping', 'Plan Limits', 'Trial Plans', 'Enterprise Plan', 'Plan Pricing', 'User Limits', 'Storage Limits'].includes(page)
        ? planTypeTab
        : 'all'
      const [pRes, sRes, iRes, payRes, cRes, aRes] = await Promise.all([
        listPlans({ page: pagination.page, limit: pagination.limit, search, type: planTypeFilter }),
        listSubscriptions({ page: 1, limit: 100, search: '' }),
        listInvoices({ page: 1, limit: 100, search: '' }),
        listPayments({ page: 1, limit: 100, search: '' }),
        listCoupons({ page: 1, limit: 100, search: '' }),
        listAddons({ page: 1, limit: 100, search: '' })
      ])
      const companyRes = await fetchCompanies({ page: 1, limit: 500, search: '', status: 'all', plan: 'all' })
      setPlans(pRes.items)
      setPagination(pRes.pagination)
      setSubscriptions(sRes.items)
      setInvoices(iRes.items)
      setPayments(payRes.items)
      setCoupons(cRes.items)
      setAddons(aRes.items)
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
  }, [pagination.page, search, planTypeTab, page])

  useEffect(() => {
    if (page === 'Trial Plans') setPlanTypeTab('trial')
    else if (page === 'Enterprise Plan') setPlanTypeTab('enterprise')
    else if (page === 'Subscription Plans') setPlanTypeTab('standard')
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
      if (selectedPlan) {
        const res = await updatePlan(selectedPlan._id, payload)
        const saved = res?.item
        if (!saved?._id) throw new Error('Database update confirmation not received')
        toastOk(`Saved in database successfully (ID: ${saved._id})`)
      } else {
        const res = await createPlan(payload)
        const saved = res?.item
        if (!saved?._id) throw new Error('Database save confirmation not received')
        toastOk(`Saved in database successfully (ID: ${saved._id})`)
      }
      setPlanModal(false)
      setSelectedPlan(null)
      loadData()
    } catch (error) {
      toastError(`Not saved in database: ${error?.response?.data?.message || error?.message || 'Failed saving plan'}`)
    }
  }

  const renderPlanTable = (title) => (
    <div className={`panel ${['Subscription Plans', 'Plan Limits', 'Plan Pricing'].includes(title) ? 'subscription-plans-panel' : ''} ${['PlanLimits', 'Plan Limits', 'PlanPricing', 'Plan Pricing'].includes(title) ? 'plan-pricing-panel' : ''}`}>
      <div className="panel-head"><h3>{title}</h3>{title === 'Subscription Plans' ? <Button onClick={() => { setSelectedPlan(null); setPlanForm({ name: '', type: planTypeTab, monthlyPrice: 0, yearlyPrice: 0, userLimit: 10, storageLimit: 5, features: '', status: 'active', autoRenewalEnabled: true }); setPlanModal(true) }}>Create Plan</Button> : null}</div>
      {['Subscription Plans', 'Plan Limits', 'Plan Pricing'].includes(title) ? (
        <div className="tabs-row">
          {[
            { key: 'standard', label: 'Standard Plans' },
            { key: 'trial', label: 'Trial Plans' },
            { key: 'enterprise', label: 'Enterprise Plans' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`chip-btn ${planTypeTab === tab.key ? 'active' : ''}`}
              onClick={() => {
                setPlanTypeTab(tab.key)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}
      {loading ? <LoadingSkeleton rows={8} /> : <DataTable columns={planCols} rows={planRows} onView={() => {}} onEdit={(row) => { const p = plans.find((x) => x._id === row.id); setSelectedPlan(p); setPlanForm({ ...p, features: (p.features || []).join(', ') }); setPlanModal(true) }} onDelete={(row) => { setDeleteId(row.id); setConfirmOpen(true) }} showViewAction={!['Plan Limits', 'Plan Pricing'].includes(title)} showDeleteAction={!['Plan Limits', 'Plan Pricing'].includes(title)} />}
      <div className="pagination-row">
        <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((v) => ({ ...v, page: v.page - 1 }))}>Prev</Button>
        <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
        <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((v) => ({ ...v, page: v.page + 1 }))}>Next</Button>
      </div>
    </div>
  )

  const invoiceRows = invoices.map((x) => ({ id: x._id, invoiceNumber: x.invoiceNumber, amount: x.amount, dueDate: new Date(x.dueDate).toLocaleDateString(), status: x.status }))
  const invoiceCols = [{ key: 'invoiceNumber', label: 'Invoice #' }, { key: 'amount', label: 'Amount' }, { key: 'dueDate', label: 'Due Date' }, { key: 'status', label: 'Status' }]

  const paymentRows = payments.map((x) => ({ id: x._id, transactionRef: x.transactionRef, amount: x.amount, method: x.method, status: x.status, createdAt: new Date(x.createdAt).toLocaleString() }))
  const paymentCols = [{ key: 'transactionRef', label: 'Ref' }, { key: 'amount', label: 'Amount' }, { key: 'method', label: 'Method' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Date' }]

  const couponRows = coupons.map((x) => ({ id: x._id, code: x.code, discountType: x.discountType, discountValue: x.discountValue, status: x.active ? 'active' : 'inactive' }))
  const couponCols = [{ key: 'code', label: 'Code' }, { key: 'discountType', label: 'Type' }, { key: 'discountValue', label: 'Value' }, { key: 'status', label: 'Status' }]

  const addonRows = addons.map((x) => ({ id: x._id, name: x.name, monthly: x.priceMonthly, yearly: x.priceYearly, status: x.active ? 'active' : 'inactive' }))
  const addonCols = [{ key: 'name', label: 'Add-on' }, { key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly' }, { key: 'status', label: 'Status' }]

  const subsRows = subscriptions.map((x) => ({ id: x._id, company: x.company?.companyName || x.company || '-', plan: x.plan?.name || x.plan || '-', billingCycle: x.billingCycle, status: x.status, autoRenewal: x.autoRenewal ? 'active' : 'inactive' }))
  const subsCols = [{ key: 'company', label: 'Company' }, { key: 'plan', label: 'Plan' }, { key: 'billingCycle', label: 'Cycle' }, { key: 'status', label: 'Status' }, { key: 'autoRenewal', label: 'Auto Renewal' }]
  const renderSection = (activePage = page) => {
    switch (activePage) {
      case 'Subscription Plans':
      case 'Feature Mapping':
      case 'Trial Plans':
      case 'Enterprise Plan':
      case 'Plan Limits':
      case 'Plan Pricing':
      case 'User Limits':
      case 'Storage Limits':
        return renderPlanTable(activePage === 'User Limits' || activePage === 'Storage Limits' || activePage === 'Plan Pricing' ? 'Plan Limits' : activePage)
      case 'Add-on Services':
        return <div className="panel"><div className="panel-head"><h3>Add-on Services</h3><Button onClick={() => setAddonModal(true)}>Create Add-on</Button></div><DataTable columns={addonCols} rows={addonRows} onView={() => {}} onEdit={(row) => { const x = addons.find((a) => a._id === row.id); setAddonForm(x); setAddonModal(true) }} onDelete={() => {}} /></div>
      case 'Plan Upgrade/Downgrade':
      case 'Auto Renewal':
      case 'Subscription History':
        return <div className="panel"><h3>{page}</h3><div className="form-grid"><FormInput label="Subscription ID" value={subscriptionForm.id || ''} onChange={(e) => setSubscriptionForm((p) => ({ ...p, id: e.target.value }))} /><FormInput label="Plan ID" value={subscriptionForm.plan} onChange={(e) => setSubscriptionForm((p) => ({ ...p, plan: e.target.value }))} /><FilterDropdown label="Billing Cycle" value={subscriptionForm.billingCycle} onChange={(v) => setSubscriptionForm((p) => ({ ...p, billingCycle: v }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} /><FilterDropdown label="Auto Renewal" value={subscriptionForm.autoRenewal ? 'yes' : 'no'} onChange={(v) => setSubscriptionForm((p) => ({ ...p, autoRenewal: v === 'yes' }))} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} /></div><div className="actions-row"><Button onClick={async () => { if (!subscriptionForm.id) return toastError('Subscription ID required'); await upgradeDowngrade(subscriptionForm.id, { planId: subscriptionForm.plan, billingCycle: subscriptionForm.billingCycle, autoRenewal: subscriptionForm.autoRenewal }); toastOk('Subscription updated'); loadData() }}>Upgrade/Downgrade</Button><Button variant="ghost" onClick={async () => { if (!subscriptionForm.id) return toastError('Subscription ID required'); await setAutoRenewal(subscriptionForm.id, subscriptionForm.autoRenewal); toastOk('Auto renewal updated'); loadData() }}>Set Auto Renewal</Button></div><DataTable columns={subsCols} rows={subsRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
      case 'Invoice Management':
      case 'Generate Invoice':
        return <div className="panel"><div className="panel-head"><h3>{page}</h3><Button onClick={() => setInvoiceModal(true)}>New Invoice</Button></div><DataTable columns={invoiceCols} rows={invoiceRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
      case 'Payment Tracking':
      case 'Failed Payments':
      case 'Refund Management':
      case 'Transaction History': {
        const filtered = page === 'Failed Payments' ? paymentRows.filter((x) => x.status === 'failed') : paymentRows
        return <div className="panel"><h3>{page}</h3><DataTable columns={paymentCols} rows={filtered} onView={() => {}} onEdit={() => {}} onDelete={async (row) => { if (page === 'Refund Management') { await refundPayment(row.id); toastOk('Refund marked'); loadData() } }} /></div>
      }
      case 'Discount Coupons':
        return <div className="panel"><div className="panel-head"><h3>Discount Coupons</h3><Button onClick={() => setCouponModal(true)}>Create Coupon</Button></div><DataTable columns={couponCols} rows={couponRows} onView={() => {}} onEdit={(row) => { const c = coupons.find((x) => x._id === row.id); setCouponForm(c); setCouponModal(true) }} onDelete={() => {}} /></div>
      default:
        return <EmptyState title="Sub-module not configured" />
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Subscription & Billing"
        description="Single-page workspace for plans, invoices, payments, coupons, add-ons, and renewals."
        breadcrumb={['Super Admin', 'Subscription & Billing', page || 'Subscription Plans']}
        primaryActionLabel="Reload"
        onPrimaryAction={loadData}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      <div className="panel filters-panel"><div className="filters-row"><div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search by name/code/invoice" /></div></div></div>
      {submodules.has(page) || !page ? renderSection(page || 'Subscription Plans') : <EmptyState title="Unknown Subscription module" />}

      <Modal open={planModal} title={selectedPlan ? 'Edit Plan' : 'Create Plan'} onClose={() => setPlanModal(false)}>
        <div className="form-grid">
          <FormInput label="Plan Name" value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} />
          <FilterDropdown label="Type" value={planForm.type} onChange={(v) => setPlanForm((p) => ({ ...p, type: v }))} options={[{ value: 'trial', label: 'Trial' }, { value: 'standard', label: 'Standard' }, { value: 'enterprise', label: 'Enterprise' }]} />
          <FormInput label="Monthly Price" type="number" value={planForm.monthlyPrice} onChange={(e) => setPlanForm((p) => ({ ...p, monthlyPrice: Number(e.target.value) }))} />
          <FormInput label="Yearly Price" type="number" value={planForm.yearlyPrice} onChange={(e) => setPlanForm((p) => ({ ...p, yearlyPrice: Number(e.target.value) }))} />
          <FormInput label="User Limit" type="number" value={planForm.userLimit} onChange={(e) => setPlanForm((p) => ({ ...p, userLimit: Number(e.target.value) }))} />
          <FormInput label="Storage Limit" type="number" value={planForm.storageLimit} onChange={(e) => setPlanForm((p) => ({ ...p, storageLimit: Number(e.target.value) }))} />
          <FormInput label="Features (comma separated)" value={planForm.features} onChange={(e) => setPlanForm((p) => ({ ...p, features: e.target.value }))} />
          <FilterDropdown label="Status" value={planForm.status} onChange={(v) => setPlanForm((p) => ({ ...p, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setPlanModal(false)}>Cancel</Button><Button onClick={savePlan}>Save Plan</Button></div>
      </Modal>

      <Modal open={invoiceModal} title="Generate Invoice" onClose={() => setInvoiceModal(false)}>
        <div className="form-grid">
          <FormInput label="Company ID" value={invoiceForm.company} onChange={(e) => setInvoiceForm((p) => ({ ...p, company: e.target.value }))} />
          <FormInput label="Amount" type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: Number(e.target.value) }))} />
          <FormInput label="Due Date" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))} />
        </div>
        <div className="actions-row"><Button onClick={async () => { try { if (!invoiceForm.company || !invoiceForm.amount || !invoiceForm.dueDate) return toastError('All invoice fields are required'); const res = await generateInvoice({ companyId: invoiceForm.company, amount: invoiceForm.amount, dueDate: invoiceForm.dueDate }); const saved = res?.item; if (!saved?._id) throw new Error('Database save confirmation not received'); toastOk(`Saved in database successfully (ID: ${saved._id})`); setInvoiceModal(false); loadData() } catch (error) { toastError(`Not saved in database: ${error?.response?.data?.message || error?.message || 'Invoice generation failed'}`) } }}>Generate</Button><Button variant="ghost" onClick={async () => { try { if (!invoiceForm.company || !invoiceForm.amount || !invoiceForm.dueDate) return toastError('All invoice fields are required'); const res = await createInvoice({ company: invoiceForm.company, amount: invoiceForm.amount, dueDate: invoiceForm.dueDate, invoiceNumber: `MAN-${Date.now()}`, status: 'pending' }); const saved = res?.item; if (!saved?._id) throw new Error('Database save confirmation not received'); toastOk(`Saved in database successfully (ID: ${saved._id})`); setInvoiceModal(false); loadData() } catch (error) { toastError(`Not saved in database: ${error?.response?.data?.message || error?.message || 'Manual invoice creation failed'}`) } }}>Create Manual</Button></div>
      </Modal>

      <Modal open={couponModal} title="Coupon" onClose={() => setCouponModal(false)}>
        <div className="form-grid">
          <FormInput label="Code" value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value }))} />
          <FilterDropdown label="Discount Type" value={couponForm.discountType} onChange={(v) => setCouponForm((p) => ({ ...p, discountType: v }))} options={[{ value: 'percent', label: 'Percent' }, { value: 'flat', label: 'Flat' }]} />
          <FormInput label="Discount Value" type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: Number(e.target.value) }))} />
          <FormInput label="Expires At" type="date" value={couponForm.expiresAt?.slice?.(0,10) || ''} onChange={(e) => setCouponForm((p) => ({ ...p, expiresAt: e.target.value }))} />
        </div>
        <div className="actions-row"><Button onClick={async () => { try { if (!couponForm.code) return toastError('Coupon code is required'); let res; if (couponForm._id) res = await updateCoupon(couponForm._id, couponForm); else res = await createCoupon(couponForm); const saved = res?.item; if (!saved?._id) throw new Error('Database save confirmation not received'); toastOk(`Saved in database successfully (ID: ${saved._id})`); setCouponModal(false); loadData() } catch (error) { toastError(`Not saved in database: ${error?.response?.data?.message || error?.message || 'Coupon save failed'}`) } }}>Save Coupon</Button></div>
      </Modal>

      <Modal open={addonModal} title="Add-on Service" onClose={() => setAddonModal(false)}>
        <div className="form-grid">
          <FormInput label="Name" value={addonForm.name} onChange={(e) => setAddonForm((p) => ({ ...p, name: e.target.value }))} />
          <FormInput label="Description" value={addonForm.description} onChange={(e) => setAddonForm((p) => ({ ...p, description: e.target.value }))} />
          <FormInput label="Monthly Price" type="number" value={addonForm.priceMonthly} onChange={(e) => setAddonForm((p) => ({ ...p, priceMonthly: Number(e.target.value) }))} />
          <FormInput label="Yearly Price" type="number" value={addonForm.priceYearly} onChange={(e) => setAddonForm((p) => ({ ...p, priceYearly: Number(e.target.value) }))} />
        </div>
        <div className="actions-row"><Button onClick={async () => { try { if (!addonForm.name) return toastError('Add-on name is required'); let res; if (addonForm._id) res = await updateAddon(addonForm._id, addonForm); else res = await createAddon(addonForm); const saved = res?.item; if (!saved?._id) throw new Error('Database save confirmation not received'); toastOk(`Saved in database successfully (ID: ${saved._id})`); setAddonModal(false); loadData() } catch (error) { toastError(`Not saved in database: ${error?.response?.data?.message || error?.message || 'Add-on save failed'}`) } }}>Save Add-on</Button></div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Plan"
        message="Are you sure you want to delete this subscription plan?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => { await deletePlan(deleteId); setConfirmOpen(false); toastOk('Plan deleted'); loadData() }}
      />
    </section>
  )
}

export default SubscriptionBillingModulePage
