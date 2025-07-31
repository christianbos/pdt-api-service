import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - PDT Card Grading',
  description: 'Panel de administración para gestión de cartas',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <div className="gradient-bg text-white rounded p-2 me-3">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h5 className="navbar-brand mb-0 fw-bold">PDT Card Grading</h5>
              <small className="text-muted">Panel de Administración</small>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <a href="/admin" className="btn btn-outline-primary btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </a>
            <a href="/admin/cards/new" className="btn btn-gradient btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Carta
            </a>
            <a href="/admin/import" className="btn btn-outline-success btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Excel
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container-fluid py-4">
        <div className="bg-white rounded shadow-sm border">
          {children}
        </div>
      </main>
    </div>
  )
}