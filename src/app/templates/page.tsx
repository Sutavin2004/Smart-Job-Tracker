'use client'

import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, Edit2, Copy, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { EmailTemplate } from '@/lib/types'
import { EMAIL_TEMPLATE_TYPES } from '@/lib/types'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await apiClient.getEmailTemplates()
      setTemplates(data)
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    try {
      await apiClient.deleteEmailTemplate(id)
      setTemplates(ts => ts.filter(t => t.id !== id))
      toast.success('Template deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  function copyTemplate(template: EmailTemplate) {
    navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{templates.length} templates</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No templates yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => (
            editingId === tpl.id
              ? <TemplateEditor
                  key={tpl.id}
                  template={tpl}
                  onSave={async (data) => {
                    const updated = await apiClient.updateEmailTemplate(tpl.id, data)
                    setTemplates(ts => ts.map(t => t.id === tpl.id ? updated : t))
                    setEditingId(null)
                    toast.success('Template saved')
                  }}
                  onCancel={() => setEditingId(null)}
                />
              : <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  onEdit={() => setEditingId(tpl.id)}
                  onDelete={() => deleteTemplate(tpl.id)}
                  onCopy={() => copyTemplate(tpl)}
                />
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold">New Template</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <TemplateEditor
              onSave={async (data) => {
                const created = await apiClient.createEmailTemplate(data)
                setTemplates(ts => [...ts, created])
                setShowNew(false)
                toast.success('Template created')
              }}
              onCancel={() => setShowNew(false)}
              inline
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template, onEdit, onDelete, onCopy
}: {
  template: EmailTemplate
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
}) {
  const typeLabel = EMAIL_TEMPLATE_TYPES.find(t => t.value === template.type)?.label ?? template.type

  return (
    <div className="card p-5 space-y-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-500 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{template.name}</h3>
          </div>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onCopy} className="p-1.5 text-slate-400 hover:text-brand-500 transition-colors" title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-brand-500 transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!template.isDefault && (
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Subject</p>
        <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{template.subject}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Preview</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{template.body}</p>
      </div>

      {template.useCount > 0 && (
        <p className="text-xs text-slate-400">Used {template.useCount} time{template.useCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

function TemplateEditor({
  template,
  onSave,
  onCancel,
  inline = false,
}: {
  template?: EmailTemplate
  onSave: (data: Partial<EmailTemplate>) => Promise<void>
  onCancel: () => void
  inline?: boolean
}) {
  const [form, setForm] = useState({
    name: template?.name ?? '',
    type: template?.type ?? 'follow_up',
    subject: template?.subject ?? '',
    body: template?.body ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name || !form.subject || !form.body) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Template Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Follow Up"
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="input"
          >
            {EMAIL_TEMPLATE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject</label>
        <input
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder="Use {{role}}, {{company}}, {{recruiterName}} as placeholders"
          className="input"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Body</label>
        <textarea
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          rows={8}
          placeholder="Email body..."
          className="input resize-none font-mono text-xs"
        />
      </div>
      <p className="text-xs text-slate-400">
        Available placeholders: {'{{role}}'}, {'{{company}}'}, {'{{recruiterName}}'}, {'{{dateApplied}}'}
      </p>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save
        </button>
        <button onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  )

  if (inline) {
    return <div className="p-6">{content}</div>
  }

  return (
    <div className="card p-5 border-2 border-brand-300 dark:border-brand-700">
      {content}
    </div>
  )
}
