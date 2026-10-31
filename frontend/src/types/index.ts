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