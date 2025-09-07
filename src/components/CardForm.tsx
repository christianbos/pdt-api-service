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
  // Helper function to merge nested objects with defaults
  const mergeWithDefaults = (data: any, defaults: any): any => {
    if (!data) return defaults
    if (typeof data !== 'object' || typeof defaults !== 'object') return data
    
    const merged = { ...defaults }
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === 'object' && typeof defaults[key] === 'object') {
          merged[key] = mergeWithDefaults(data[key], defaults[key])
        } else {
          merged[key] = data[key]
        }
      }
    }
    return merged
  }

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
    tcg: initialData?.tcg || '',
    gradeText: initialData?.gradeText || '',
    notes: initialData?.notes || '',
    gradeDate: initialData?.gradeDate || new Date().toISOString(),
    surface: mergeWithDefaults(initialData?.surface, {
      finalScore: null,
      bent: null,
      bentWeight: null,
      front: { color: null, scratches: null, colorWeight: null, scratchesWeight: null, totalWeight: null },
      back: { color: null, scratches: null, colorWeight: null, scratchesWeight: null, totalWeight: null }
    }),
    edges: mergeWithDefaults(initialData?.edges, {
      finalScore: null,
      frontWeight: null,
      backWeight: null,
      front: { left: null, top: null, right: null, bottom: null },
      back: { left: null, top: null, right: null, bottom: null }
    }),
    corners: mergeWithDefaults(initialData?.corners, {
      finalScore: null,
      frontWeight: null,
      backWeight: null,
      front: { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null },
      back: { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null }
    }),
    centering: mergeWithDefaults(initialData?.centering, {
      frontScore: null,
      backScore: null,
      finalScore: null,
      front: { left: null, top: null },
      back: { left: null, top: null }
    })
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
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Set *</label>
              <input
                type="text"
                value={formData.set}
                onChange={(e) => updateFormData('set', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Número *</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => updateFormData('number', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Año *</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => updateFormData('year', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Rareza *</label>
              <input
                type="text"
                value={formData.rarity}
                onChange={(e) => updateFormData('rarity', e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Número de Certificación *</label>
              <input
                type="number"
                value={formData.certificationNumber}
                onChange={(e) => updateFormData('certificationNumber', parseInt(e.target.value))}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Grado Final *</label>
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
              <label className="form-label">Versión *</label>
              <input
                type="number"
                value={formData.version}
                onChange={(e) => updateFormData('version', parseInt(e.target.value))}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">TCG</label>
              <input
                type="text"
                value={formData.tcg}
                onChange={(e) => updateFormData('tcg', e.target.value)}
                className="form-control"
                placeholder="Pokemon, Yu-Gi-Oh, etc."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Texto de Grado</label>
              <input
                type="text"
                value={formData.gradeText}
                onChange={(e) => updateFormData('gradeText', e.target.value)}
                className="form-control"
                placeholder="NEAR MINT, EXCELLENT, etc."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Fecha de Gradeo</label>
              <input
                type="datetime-local"
                value={formData.gradeDate?.slice(0, 16) || ''}
                onChange={(e) => updateFormData('gradeDate', new Date(e.target.value).toISOString())}
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Notas</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormData('notes', e.target.value || '')}
                className="form-control"
                rows={2}
                placeholder="Notas adicionales (opcional)"
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
                value={formData.surface.finalScore || ''}
                onChange={(e) => updateFormData('surface.finalScore', e.target.value ? parseFloat(e.target.value) : null)}
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
                value={formData.surface.bent || ''}
                onChange={(e) => updateFormData('surface.bent', e.target.value ? parseFloat(e.target.value) : null)}
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
                    value={formData.surface.front.color || ''}
                    onChange={(e) => updateFormData('surface.front.color', e.target.value ? parseFloat(e.target.value) : null)}
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
                    value={formData.surface.front.scratches || ''}
                    onChange={(e) => updateFormData('surface.front.scratches', e.target.value ? parseFloat(e.target.value) : null)}
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
                    value={formData.surface.back.color || ''}
                    onChange={(e) => updateFormData('surface.back.color', e.target.value ? parseFloat(e.target.value) : null)}
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
                    value={formData.surface.back.scratches || ''}
                    onChange={(e) => updateFormData('surface.back.scratches', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edges */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Edges</h3>
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
                value={formData.edges.finalScore || ''}
                onChange={(e) => updateFormData('edges.finalScore', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Front Weight</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.edges.frontWeight || ''}
                onChange={(e) => updateFormData('edges.frontWeight', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Back Weight</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.edges.backWeight || ''}
                onChange={(e) => updateFormData('edges.backWeight', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.front.left || ''}
                    onChange={(e) => updateFormData('edges.front.left', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.front.top || ''}
                    onChange={(e) => updateFormData('edges.front.top', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.front.right || ''}
                    onChange={(e) => updateFormData('edges.front.right', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.front.bottom || ''}
                    onChange={(e) => updateFormData('edges.front.bottom', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.back.left || ''}
                    onChange={(e) => updateFormData('edges.back.left', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.back.top || ''}
                    onChange={(e) => updateFormData('edges.back.top', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.back.right || ''}
                    onChange={(e) => updateFormData('edges.back.right', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.edges.back.bottom || ''}
                    onChange={(e) => updateFormData('edges.back.bottom', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corners */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Corners</h3>
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
                value={formData.corners.finalScore || ''}
                onChange={(e) => updateFormData('corners.finalScore', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Front Weight</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.corners.frontWeight || ''}
                onChange={(e) => updateFormData('corners.frontWeight', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Back Weight</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.corners.backWeight || ''}
                onChange={(e) => updateFormData('corners.backWeight', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Top Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.front.topLeft || ''}
                    onChange={(e) => updateFormData('corners.front.topLeft', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.front.topRight || ''}
                    onChange={(e) => updateFormData('corners.front.topRight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.front.bottomLeft || ''}
                    onChange={(e) => updateFormData('corners.front.bottomLeft', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.front.bottomRight || ''}
                    onChange={(e) => updateFormData('corners.front.bottomRight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Top Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.back.topLeft || ''}
                    onChange={(e) => updateFormData('corners.back.topLeft', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.back.topRight || ''}
                    onChange={(e) => updateFormData('corners.back.topRight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.back.bottomLeft || ''}
                    onChange={(e) => updateFormData('corners.back.bottomLeft', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.corners.back.bottomRight || ''}
                    onChange={(e) => updateFormData('corners.back.bottomRight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centering */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Centering</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Front Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.centering.frontScore || ''}
                onChange={(e) => updateFormData('centering.frontScore', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Back Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.centering.backScore || ''}
                onChange={(e) => updateFormData('centering.backScore', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Final Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.centering.finalScore || ''}
                onChange={(e) => updateFormData('centering.finalScore', e.target.value ? parseFloat(e.target.value) : null)}
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.centering.front.left || ''}
                    onChange={(e) => updateFormData('centering.front.left', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.centering.front.top || ''}
                    onChange={(e) => updateFormData('centering.front.top', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.centering.back.left || ''}
                    onChange={(e) => updateFormData('centering.back.left', e.target.value ? parseFloat(e.target.value) : null)}
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.centering.back.top || ''}
                    onChange={(e) => updateFormData('centering.back.top', e.target.value ? parseFloat(e.target.value) : null)}
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