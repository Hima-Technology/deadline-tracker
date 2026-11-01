export type Role = 'admin' | 'staff' | 'auditor'
export type Status = 'open' | 'due_soon' | 'overdue' | 'closed'
export type Frequency = 'monthly' | 'quarterly' | 'annual' | 'one_off'
export type Authority = 'TRA' | 'ZRA' | 'BPRA' | 'ZSSF'

export const AUTHORITIES: { value: Authority; label: string }[] = [
  { value: 'TRA', label: 'TRA' },
  { value: 'ZRA', label: 'ZRA' },
  { value: 'BPRA', label: 'BPRA' },
  { value: 'ZSSF', label: 'ZSSF' },
]

export const CLIENT_TAX_TYPES = [
  { value: 'tra_paye', authority: 'TRA', label: 'PAYE Return' },
  { value: 'tra_sdl', authority: 'TRA', label: 'Skills and Development Levy (SDL)' },
  { value: 'tra_wht', authority: 'TRA', label: 'Withholding Tax (WHT)' },
  { value: 'tra_provisional_income_tax', authority: 'TRA', label: 'Provisional Income Tax' },
  { value: 'tra_corporate_income_tax', authority: 'TRA', label: 'Corporate Income Tax / Final Return' },
  { value: 'zra_vat', authority: 'ZRA', label: 'VAT Return and Payment' },
  { value: 'zra_infrastructure_tax', authority: 'ZRA', label: 'Infrastructure Tax' },
  { value: 'zra_hotel_levy', authority: 'ZRA', label: 'Hotel Levy' },
  { value: 'zra_restaurant_levy', authority: 'ZRA', label: 'Restaurant Levy' },
  { value: 'zra_tour_operation_levy', authority: 'ZRA', label: 'Tour Operation Levy' },
  { value: 'zra_stamp_duty', authority: 'ZRA', label: 'Stamp Duty' },
  { value: 'zssf_employer_registration', authority: 'ZSSF', label: 'Employer Registration' },
  { value: 'zssf_monthly_contributions', authority: 'ZSSF', label: 'Monthly Contributions' },
  { value: 'bpra_company_annual_return', authority: 'BPRA', label: 'Company Annual Return' },
  { value: 'bpra_foreign_company_annual_return', authority: 'BPRA', label: 'Foreign Company Annual Return' },
  { value: 'bpra_sole_proprietor_annual_return', authority: 'BPRA', label: 'Business Name Annual Return — Sole Proprietor' },
  { value: 'bpra_partnership_annual_return', authority: 'BPRA', label: 'Business Name Annual Return — Partnership' },
  { value: 'bpra_particulars_changes', authority: 'BPRA', label: 'Changes to Particulars' },
] as const

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: Role
  is_active: boolean
  created_at?: string
}

export interface Client {
  id: number
  company_name: string
  contact_person?: string
  phone?: string
  email?: string
  notes?: string
  created_at?: string
  
  // Vigezo vya Mikataba na Malipo
  contract_start_date?: string
  contract_end_date?: string
  service_type?: string
  total_contract_amount?: number
  amount_paid?: number
  assessment_info?: string

  // Vigezo vipya (Company Profile & Credentials)
  location?: 'Mainland' | 'Zanzibar'
  tin?: string
  company_registration_number?: string
  business_type?: 'company' | 'foreign_company' | 'sole_proprietor' | 'partnership' | 'other'
  enabled_tax_types?: string[] | string
  tra_number?: string
  zra_number?: string
  bpra_number?: string
  zssf_number?: string
  industry?: string
  financial_year_end?: string
  tra_username?: string
  tra_password?: string
  zra_username?: string
  zra_password?: string
  bpra_username?: string
  bpra_password?: string
  zssf_username?: string
  zssf_password?: string
  auditor_id?: number
}

export interface Obligation {
  id: number
  client_id: number
  title: string
  frequency: Frequency
  due_day: number
  default_staff_id?: number
  reminder_days: number[]
  is_active: boolean
  authority?: 'TRA' | 'ZRA' | 'ZSSF' | 'BPRA'
  document_type?: string
  filing_status?: 'Not started' | 'Waiting for client' | 'In preparation' | 'Under review' | 'Filed' | 'Rejected' | 'Amended'
  confirmed_due_date?: string
  requires_upload?: boolean
  instructions?: string
}

export interface Closing {
  id: number
  obligation_id: number
  client_id: number
  assigned_staff_id: number | null
  period_label: string
  due_date: string
  status: Status
  closed_at?: string | null
  closed_by?: number | null
  reference_number?: string | null
  proof_file_path?: string | null
  authorities?: Authority[]
  authority?: string
  completion_notes?: string | null
  requires_upload?: boolean
  document_type?: string | null
  instructions?: string | null
  company_name?: string
  obligation_title?: string
  staff_name?: string
}

export interface Payment {
  id: number
  client_id: number
  amount: number
  payment_date: string
  receipt_number?: string
  created_by?: number
  created_at?: string
}

export interface Assessment {
  id: number
  client_id: number
  authority: 'TRA' | 'ZRA' | 'BPRA'
  reference_number?: string
  assessment_date?: string
  status?: string
  notes?: string
  created_at?: string
}

export interface Counters {
  overdue: number
  due_soon: number
  closed_this_month: number
  open: number
}

export interface StaffPerf {
  id: number
  name: string
  open_count: number
  overdue_count: number
  on_time: number
  late: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string> | null
}