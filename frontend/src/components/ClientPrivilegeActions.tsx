import { useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from './Modal'
import { CLIENT_TAX_TYPES } from '../types'
import { useLanguage } from '../context/LanguageContext'

type ClientProfile = {
  id: number
  company_name?: string
  contact_person?: string
  phone?: string
  email?: string
  location?: string
  industry?: string
  tin?: string
  company_registration_number?: string
  business_type?: string
  financial_year_end?: string
  enabled_tax_types?: unknown
}

type EditableProfileField =
  | 'tin'
  | 'company_registration_number'
  | 'business_type'
  | 'financial_year_end'
  | 'location'
  | 'industry'
  | 'contact_person'
  | 'phone'
  | 'email'

type RevealedPasswords = Record<string, string | null>

function parseTaxTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((type): type is string => typeof type === 'string')
  if (typeof value !== 'string' || !value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((type): type is string => typeof type === 'string') : []
  } catch {
    return []
  }
}

export default function ClientPrivilegeActions({
  clientId,
  companyName,
  permissions,
  onClientDeleted,
}: {
  clientId: number
  companyName?: string
  permissions: string[]
  onClientDeleted?: (clientId: number) => void
}) {
  const { t } = useLanguage()
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordsOpen, setPasswordsOpen] = useState(false)
  const [systemPassword, setSystemPassword] = useState('')
  const [revealedPasswords, setRevealedPasswords] = useState<RevealedPasswords | null>(null)
  const [revealError, setRevealError] = useState('')
  const [revealBusy, setRevealBusy] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileSaveBusy, setProfileSaveBusy] = useState(false)
  const [uploadAuthority, setUploadAuthority] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const canViewProfile = permissions.some(permission => [
    'view_clients', 'edit_clients', 'view_compliance_profile', 'edit_compliance_profile',
  ].includes(permission))
  const canViewPasswords = permissions.includes('view_passwords')
  const canEditClient = permissions.includes('edit_clients')
  const canEditCompliance = permissions.includes('edit_compliance_profile')
  const canDeleteClient = permissions.includes('delete_clients')
  const uploadAuthorities = [
    { key: 'TRA', permission: 'upload_tra' },
    { key: 'ZRA', permission: 'upload_zra' },
    { key: 'BPRA', permission: 'upload_bpra' },
    { key: 'ZSSF', permission: 'upload_zssf' },
  ].filter(authority => permissions.includes(authority.permission))
  const profileFields: { label: string; field: EditableProfileField; value?: string; canEdit: boolean }[] = [
    { label: 'TIN', field: 'tin', value: profile?.tin, canEdit: canEditClient },
    { label: 'Company Registration Number', field: 'company_registration_number', value: profile?.company_registration_number, canEdit: canEditCompliance },
    { label: 'Business Type', field: 'business_type', value: profile?.business_type?.replaceAll('_', ' '), canEdit: canEditCompliance },
    { label: 'Financial Year-End', field: 'financial_year_end', value: profile?.financial_year_end, canEdit: canEditCompliance },
    { label: 'Location', field: 'location', value: profile?.location, canEdit: canEditClient },
    { label: 'Industry', field: 'industry', value: profile?.industry, canEdit: canEditClient },
    { label: 'Contact Person', field: 'contact_person', value: profile?.contact_person, canEdit: canEditClient },
    { label: 'Phone', field: 'phone', value: profile?.phone, canEdit: canEditClient },
    { label: 'Email', field: 'email', value: profile?.email, canEdit: canEditClient },
  ]

  async function openClientProfile() {
    setProfileOpen(true)
    setProfile(null)
    setProfileError('')
    setProfileLoading(true)
    try {
      const response = await api.get(`/clients/${clientId}`)
      setProfile(response.data.data)
    } catch (error) {
      setProfileError(errMsg(error))
    } finally {
      setProfileLoading(false)
    }
  }

  async function revealClientPasswords() {
    if (!systemPassword) {
      setRevealError(t('Enter your system password to continue.'))
      return
    }
    setRevealBusy(true)
    setRevealError('')
    try {
      const response = await api.post(`/clients/${clientId}/passwords`, { system_password: systemPassword })
      setRevealedPasswords(response.data.data)
      setSystemPassword('')
    } catch (error) {
      setRevealError(errMsg(error))
    } finally {
      setRevealBusy(false)
    }
  }

  async function saveProfileChanges() {
    if (!profile) return
    const changes: Record<string, unknown> = {}
    if (canEditClient) {
      Object.assign(changes, {
        company_name: profile.company_name,
        contact_person: profile.contact_person,
        phone: profile.phone,
        email: profile.email,
        location: profile.location,
        industry: profile.industry,
        tin: profile.tin,
      })
    }
    if (canEditCompliance) {
      Object.assign(changes, {
        company_registration_number: profile.company_registration_number,
        business_type: profile.business_type,
        financial_year_end: profile.financial_year_end,
        enabled_tax_types: parseTaxTypes(profile.enabled_tax_types),
      })
    }
    setProfileSaveBusy(true)
    setProfileError('')
    try {
      const response = await api.put(`/clients/${clientId}`, changes)
      setProfile(response.data.data)
      setEditingProfile(false)
    } catch (error) {
      setProfileError(errMsg(error))
    } finally {
      setProfileSaveBusy(false)
    }
  }

  async function uploadClientDocument() {
    if (!uploadAuthority || !uploadFile) return
    const formData = new FormData()
    formData.append('authority', uploadAuthority)
    formData.append('document', uploadFile)
    setUploadBusy(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      await api.post(`/clients/${clientId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadSuccess(t('Document uploaded successfully.'))
      setUploadFile(null)
    } catch (error) {
      setUploadError(errMsg(error))
    } finally {
      setUploadBusy(false)
    }
  }

  async function deleteClient() {
    if (!window.confirm(t('Are you sure you want to delete this client?'))) return
    setDeleteBusy(true)
    try {
      await api.delete(`/clients/${clientId}`)
      onClientDeleted?.(clientId)
    } catch (error) {
      setActionError(errMsg(error))
    } finally {
      setDeleteBusy(false)
    }
  }

  if (!canViewProfile && !canViewPasswords && uploadAuthorities.length === 0 && !canDeleteClient) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canViewProfile && (
          <button
            type="button"
            onClick={() => void openClientProfile()}
            className="inline-flex items-center gap-1 rounded border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
          >
            <span className="material-symbols-outlined text-base">contact_page</span>
            {permissions.includes('view_clients') ? t('View client') : t('View compliance profile')}
          </button>
        )}
        {canViewPasswords && (
          <button
            type="button"
            onClick={() => {
              setPasswordsOpen(true)
              setSystemPassword('')
              setRevealedPasswords(null)
              setRevealError('')
            }}
            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            <span className="material-symbols-outlined text-base">key</span>
            {t('Reveal passwords')}
          </button>
        )}
        {uploadAuthorities.map(authority => (
          <button
            key={authority.key}
            type="button"
            onClick={() => {
              setUploadAuthority(authority.key)
              setUploadFile(null)
              setUploadError('')
              setUploadSuccess('')
            }}
            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            {t('Upload')} {authority.key} {t('document')}
          </button>
        ))}
        {canDeleteClient && (
          <button
            type="button"
            onClick={() => void deleteClient()}
            disabled={deleteBusy}
            className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            {deleteBusy ? t('Deleting...') : t('Delete Client')}
          </button>
        )}
      </div>
      {actionError && <p role="alert" className="mt-2 text-xs text-red-700">{actionError}</p>}

      <Modal
        open={profileOpen}
        onClose={() => { setProfileOpen(false); setProfile(null); setProfileError('') }}
        title={t('Client compliance profile')}
      >
        {profileLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">{t('Loading...')}</p>
        ) : profileError ? (
          <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{profileError}</p>
        ) : profile ? (
          <div className="max-h-[65vh] space-y-4 overflow-y-auto">
            <div className="rounded border border-cyan-100 bg-cyan-50 p-3">
              {editingProfile && canEditClient ? (
                <input
                  aria-label={t('Company Name')}
                  value={profile.company_name || ''}
                  onChange={event => setProfile({ ...profile, company_name: event.target.value })}
                  className="w-full rounded border border-cyan-200 bg-white px-2 py-1 font-bold text-slate-800"
                />
              ) : (
                <h3 className="font-bold text-slate-800">{profile.company_name || companyName}</h3>
              )}
              <p className="mt-1 text-xs text-slate-500">{profile.location || '—'} · {profile.industry || '—'}</p>
            </div>
            <dl className="grid gap-x-6 sm:grid-cols-2">
              {profileFields.map(({ label, field, value, canEdit }) => (
                <div key={label} className="border-b border-slate-100 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t(label)}</dt>
                  <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                    {editingProfile && canEdit ? (
                      field === 'business_type' ? (
                        <select
                          value={profile.business_type || ''}
                          onChange={event => setProfile({ ...profile, business_type: event.target.value })}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1"
                        >
                          <option value="">—</option>
                          {['company', 'foreign_company', 'sole_proprietor', 'partnership', 'other'].map(option => (
                            <option key={option} value={option}>{t(option.replaceAll('_', ' '))}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field === 'financial_year_end' ? 'date' : 'text'}
                          value={String(profile[field as keyof ClientProfile] || '').split('T')[0]}
                          onChange={event => setProfile({ ...profile, [field]: event.target.value })}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1"
                        />
                      )
                    ) : value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <div>
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('Enabled Compliance Types')}</h4>
              <div className="flex flex-wrap gap-2">
                {CLIENT_TAX_TYPES
                  .map(type => {
                    const enabledTypes = parseTaxTypes(profile.enabled_tax_types)
                    const enabled = enabledTypes.includes(type.value)
                    return editingProfile && canEditCompliance ? (
                      <label key={type.value} className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={event => setProfile({
                            ...profile,
                            enabled_tax_types: event.target.checked
                              ? [...enabledTypes, type.value]
                              : enabledTypes.filter(value => value !== type.value),
                          })}
                        />
                        {type.authority}: {type.label}
                      </label>
                    ) : enabled ? (
                      <span key={type.value} className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs text-cyan-800">
                        {type.authority}: {type.label}
                      </span>
                    ) : null
                  })}
              </div>
            </div>
            {(canEditClient || canEditCompliance) && (
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                {editingProfile ? (
                  <>
                    <button type="button" onClick={() => setEditingProfile(false)} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                      {t('Cancel')}
                    </button>
                    <button type="button" onClick={() => void saveProfileChanges()} disabled={profileSaveBusy} className="rounded bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      {profileSaveBusy ? t('Saving...') : t('Save')}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setEditingProfile(true)} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                    {canEditClient ? t('Edit client') : t('Edit compliance profile')}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(uploadAuthority)}
        onClose={() => { setUploadAuthority(''); setUploadFile(null); setUploadError(''); setUploadSuccess('') }}
        title={`${t('Upload')} ${uploadAuthority} ${t('document')}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{companyName}</p>
          {uploadError && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{uploadError}</p>}
          {uploadSuccess && <p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{uploadSuccess}</p>}
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('Select a document')}
            <input
              type="file"
              accept="application/pdf,image/*,.doc,.docx"
              onChange={event => setUploadFile(event.target.files?.[0] || null)}
              className="mt-2 block w-full text-sm font-normal normal-case text-slate-700"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void uploadClientDocument()}
              disabled={uploadBusy || !uploadFile}
              className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {uploadBusy ? t('Uploading...') : t('Upload')}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={passwordsOpen}
        onClose={() => { setPasswordsOpen(false); setSystemPassword(''); setRevealedPasswords(null); setRevealError('') }}
        title={t('Client passwords')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{companyName}</p>
          {revealError && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{revealError}</p>}
          {revealedPasswords ? (
            <div className="space-y-2">
              {(['tra_password', 'zra_password', 'bpra_password', 'zssf_password'] as const).map(field => (
                <div key={field} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm">
                  <span className="font-semibold uppercase text-slate-600">{field.replace('_password', '')}</span>
                  <span className="break-all font-mono text-slate-800">{revealedPasswords[field] || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('System password')}
                <input
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                  value={systemPassword}
                  onChange={event => setSystemPassword(event.target.value)}
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void revealClientPasswords()}
                  disabled={revealBusy || !systemPassword}
                  className="rounded-sm bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {revealBusy ? t('Loading...') : t('Verify and reveal')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
