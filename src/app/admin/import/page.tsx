'use client'

import { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/cards/import')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'card_template.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  const handleImport = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo Excel')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/cards/import', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: formData
      })

      const data = await response.json()
      setResults(data)

      if (response.ok) {
        alert(`Importación completada: ${data.results.success}/${data.results.total} cartas importadas`)
      } else {
        alert('Error en la importación: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al importar el archivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="gradient-bg text-white rounded p-2 me-3">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h1 className="h2 mb-0 fw-bold">Importar Cartas</h1>
            <small className="text-muted">Sube un archivo Excel para importar múltiples cartas al sistema</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Step 1: Download Template */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-3">
                  <div className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                    <span className="fw-bold">1</span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title">Descargar Plantilla Excel</h5>
                  <p className="card-text text-muted mb-3">
                    Descarga la plantilla con el formato correcto que incluye todas las columnas necesarias para el gradeo de cartas.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="btn btn-primary"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Plantilla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Upload File */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-3">
                  <div className="badge bg-success rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                    <span className="fw-bold">2</span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title">Seleccionar Archivo Excel</h5>
                  <p className="card-text text-muted mb-3">
                    Completa la plantilla con los datos de las cartas y súbela aquí. Asegúrate de que todos los campos obligatorios estén llenos.
                  </p>
                  
                  <div className="border border-2 border-dashed border-secondary rounded p-4">
                    <div className="text-center">
                      <svg width="48" height="48" className="mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m0 0V9a2 2 0 012-2h.01" />
                      </svg>
                      <div>
                        <label htmlFor="file-upload" className="btn btn-outline-primary">
                          Seleccionar archivo Excel
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="d-none"
                          />
                        </label>
                        <p className="mt-2 small text-muted">
                          Archivos .xlsx o .xls únicamente
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {file && (
                    <div className="mt-3 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded">
                      <div className="d-flex align-items-center">
                        <svg width="20" height="20" className="text-success me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="small fw-medium text-success">
                          Archivo seleccionado: {file.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Import */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-3">
                  <div className="badge bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                    <span className="fw-bold">3</span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title">Ejecutar Importación</h5>
                  <p className="card-text text-muted mb-3">
                    Una vez que hayas seleccionado el archivo, haz clic en el botón para importar todas las cartas al sistema.
                  </p>
                  
                  <button
                    onClick={handleImport}
                    disabled={!file || loading}
                    className="btn btn-success"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Importando...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-2">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Importar Cartas
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex align-items-center">
                  <div className="badge bg-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '32px', height: '32px'}}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h5 className="card-title mb-0">Resultados de la Importación</h5>
                </div>
              </div>
              <div className="card-body">
                {/* Success Summary */}
                <div className="alert alert-success">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="alert-heading">{results.message}</h6>
                      <div className="d-flex gap-4 mt-2 small">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-success me-2">✓</span>
                          Exitosos: {results.results.success}
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-primary me-2">#</span>
                          Total: {results.results.total}
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-danger me-2">✗</span>
                          Errores: {results.results.errors.length}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="h3 text-success mb-0">
                        {Math.round((results.results.success / results.results.total) * 100)}%
                      </div>
                      <small className="text-muted">Tasa de éxito</small>
                    </div>
                  </div>
                </div>

                {/* Errors Section */}
                {results.results.errors.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-danger d-flex align-items-center mb-3">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Errores Encontrados ({results.results.errors.length})
                    </h6>
                    <div className="alert alert-danger" style={{maxHeight: '300px', overflowY: 'auto'}}>
                      {results.results.errors.map((error: any, index: number) => (
                        <div key={index} className={`d-flex align-items-start ${index < results.results.errors.length - 1 ? 'border-bottom pb-2 mb-2' : ''}`}>
                          <span className="badge bg-danger me-2 mt-1">{error.row}</span>
                          <div>
                            <div className="fw-semibold small">Fila {error.row}</div>
                            <div className="small">{error.error}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  <a href="/admin" className="btn btn-outline-secondary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Dashboard
                  </a>
                  
                  <button
                    onClick={() => {
                      setResults(null)
                      setFile(null)
                    }}
                    className="btn btn-primary"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Nueva Importación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}