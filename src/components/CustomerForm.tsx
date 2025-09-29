'use client'

import { useState } from 'react'
import { CreateCustomerRequest, UpdateCustomerRequest } from '@/types/customer'

interface CustomerFormProps {
  initialData?: Partial<CreateCustomerRequest | UpdateCustomerRequest>
  onSubmit: (data: CreateCustomerRequest | UpdateCustomerRequest) => Promise<void>
  submitLabel: string
}

export default function CustomerForm({ initialData, onSubmit, submitLabel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Preparar datos, excluyendo email vacío
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        ...(formData.email.trim() && { email: formData.email.trim() })
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Información del Cliente</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-12">
              <label className="form-label">Email (Opcional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-control"
                placeholder="cliente@ejemplo.com"
              />
              <div className="form-text">
                Útil para identificar al cliente en el sistema
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-gradient"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Procesando...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
