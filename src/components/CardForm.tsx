'use client'

import { useState } from 'react'
import { CreateCardRequest } from '@/types/card'
import ImageUpload from './ImageUpload'

interface CardFormProps {
  initialData?: Partial<CreateCardRequest>
  onSubmit: (data: CreateCardRequest) => Promise<void>
  submitLabel: string
}

export default function CardForm({ initialData, onSubmit, submitLabel }: CardFormProps) {
  const [formData, setFormData] = useState<CreateCardRequest>({
    name: initialData?.name || '',
    set: initialData?.set || '',
    number: initialData?.number || '',
    year: initialData?.year || '',
    rarity: initialData?.rarity || '',
    finalGrade: initialData?.finalGrade || 10,
    certificationNumber: initialData?.certificationNumber || 0,
    version: initialData?.version || 1,
    has3DScan: initialData?.has3DScan || false,
    surface: initialData?.surface || {
      finalScore: 10,
      bent: 10,
      bentWeight: null,
      front: { color: 10, scratches: 10, colorWeight: 0.3, scratchesWeight: 0.7, totalWeight: 0.45 },
      back: { color: 10, scratches: 10, colorWeight: 0.3, scratchesWeight: 0.7, totalWeight: 0.45 }
    },
    edges: initialData?.edges || {
      finalScore: 10,
      frontWeight: 0.6,
      backWeight: 0.4,
      front: { left: 10, top: 10, right: 10, bottom: 10 },
      back: { left: 10, top: 10, right: 10, bottom: 10 }
    },
    corners: initialData?.corners || {
      finalScore: 10,
      frontWeight: 0.6,
      backWeight: 0.4,
      front: { topLeft: 10, topRight: 10, bottomLeft: 10, bottomRight: 10 },
      back: { topLeft: 10, topRight: 10, bottomLeft: 10, bottomRight: 10 }
    },
    centering: initialData?.centering || {
      frontScore: 10,
      backScore: 10,
      finalScore: 10,
      front: { left: 10, top: 10 },
      back: { left: 10, top: 10 }
    }
  })

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

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.')
      const newData = { ...prev }
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Información básica */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Información Básica</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Set</label>
              <input
                type="text"
                value={formData.set}
                onChange={(e) => updateFormData('set', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Número</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => updateFormData('number', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Año</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => updateFormData('year', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Rareza</label>
              <input
                type="text"
                value={formData.rarity}
                onChange={(e) => updateFormData('rarity', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Número de Certificación</label>
              <input
                type="number"
                value={formData.certificationNumber}
                onChange={(e) => updateFormData('certificationNumber', parseInt(e.target.value))}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Grado Final</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.finalGrade}
                onChange={(e) => updateFormData('finalGrade', parseFloat(e.target.value))}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Versión</label>
              <input
                type="number"
                value={formData.version}
                onChange={(e) => updateFormData('version', parseInt(e.target.value))}
                className="form-control"
                required
              />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  type="checkbox"
                  checked={formData.has3DScan}
                  onChange={(e) => updateFormData('has3DScan', e.target.checked)}
                  className="form-check-input"
                  id="has3DScan"
                />
                <label className="form-check-label" htmlFor="has3DScan">Tiene escaneo 3D</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Surface */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Surface</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Score Final</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.surface.finalScore}
                onChange={(e) => updateFormData('surface.finalScore', parseFloat(e.target.value))}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Bent</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.surface.bent}
                onChange={(e) => updateFormData('surface.bent', parseFloat(e.target.value))}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Bent Weight</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.surface.bentWeight || ''}
                onChange={(e) => updateFormData('surface.bentWeight', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Color</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.surface.front.color}
                    onChange={(e) => updateFormData('surface.front.color', parseFloat(e.target.value))}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Scratches</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.surface.front.scratches}
                    onChange={(e) => updateFormData('surface.front.scratches', parseFloat(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Color</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.surface.back.color}
                    onChange={(e) => updateFormData('surface.back.color', parseFloat(e.target.value))}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Scratches</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.surface.back.scratches}
                    onChange={(e) => updateFormData('surface.back.scratches', parseFloat(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
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