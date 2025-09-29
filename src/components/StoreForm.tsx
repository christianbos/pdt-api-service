'use client'

import { useState } from 'react'
import { CreateStoreRequest, Store, DEFAULT_STORE_PRICING } from '@/types/store'
import LogoUpload from './LogoUpload'

interface StoreFormProps {
  initialData?: Partial<Store>
  onSubmit: (data: CreateStoreRequest | Partial<CreateStoreRequest>) => Promise<void>
  submitLabel: string
}

export default function StoreForm({ initialData, onSubmit, submitLabel }: StoreFormProps) {
  const [formData, setFormData] = useState<Partial<CreateStoreRequest>>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    logoUrl: initialData?.logoUrl || '',
    gradingPrice: initialData?.gradingPrice || DEFAULT_STORE_PRICING.gradingPrice,
    mysteryPackPrice: initialData?.mysteryPackPrice || DEFAULT_STORE_PRICING.mysteryPackPrice,
  });

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
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
          <h3 className="card-title mb-0">Información de la Tienda</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre *</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="form-control" 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                className="form-control" 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                className="form-control" 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Dirección</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                className="form-control" 
              />
            </div>
            <div className="col-md-12">
              <label className="form-label">Logo de la Tienda</label>
              <LogoUpload
                onUpload={(url) => setFormData({ ...formData, logoUrl: url })}
                initialUrl={formData.logoUrl}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Precios para esta Tienda</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Precio Grading *</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input 
                  type="number" 
                  value={formData.gradingPrice} 
                  onChange={(e) => setFormData({ ...formData, gradingPrice: Number(e.target.value) })} 
                  className="form-control" 
                  min="100"
                  max="500"
                  step="1"
                  required
                />
                <span className="input-group-text">MXN</span>
              </div>
              <div className="form-text">Precio que pagará esta tienda por cada carta de grading</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Precio Mystery Pack *</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input 
                  type="number" 
                  value={formData.mysteryPackPrice} 
                  onChange={(e) => setFormData({ ...formData, mysteryPackPrice: Number(e.target.value) })} 
                  className="form-control" 
                  min="50"
                  max="300"
                  step="1"
                  required
                />
                <span className="input-group-text">MXN</span>
              </div>
              <div className="form-text">Precio que pagará esta tienda por cada mystery pack</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" disabled={loading} className="btn btn-gradient">
          {loading ? 'Procesando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}