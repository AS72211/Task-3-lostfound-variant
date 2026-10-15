import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let ignore = false
    setForm(defaults)
    setError('')
    setLoadFailed(false)
    setLoading(Boolean(id))
    if (!id) return

    async function loadItem() {
      try {
        const { data } = await api.get('/items/' + id)
        if (ignore) return
        const { title, status, category, location, description } = data.item
        setForm({ title, status, category, location: location ?? '', description: description ?? '' })
      } catch (err) {
        if (ignore) return
        setError(err?.response?.data?.message || 'Failed to load item')
        setLoadFailed(true)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadItem()
    // Ignore responses after navigating away or switching items.
    return () => { ignore = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading || saving || loadFailed) return
    setError('')
    setSaving(true)
    // Only send editable fields; the API gets the reporter from the token.
    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }
    try {
      if (id) await api.patch('/items/' + id, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {loading && <p role="status">Loading item…</p>}
        <fieldset disabled={loading || saving || loadFailed} className="space-y-3">
          <input className="input" type="text" name="title" aria-label="Title" placeholder="Title" required value={form.title} onChange={onChange} />
          <select className="input" name="status" aria-label="Status" value={form.status} onChange={onChange}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
          </select>
          <select className="input" name="category" aria-label="Category" value={form.category} onChange={onChange}>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
          <input className="input" type="text" name="location" aria-label="Location (optional)" placeholder="Location (optional)" value={form.location} onChange={onChange} />
          <textarea className="input" name="description" aria-label="Description (optional)" placeholder="Description (optional)" rows={3} value={form.description} onChange={onChange} />
          {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
          <button className="btn disabled:opacity-50" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </fieldset>
      </form>
    </div>
  )
}
