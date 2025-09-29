import { Metadata } from 'next'
import Link from 'next/link'

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
            <Link href="/admin" className="btn btn-outline-primary btn-sm">Dashboard</Link>
            <div className="dropdown">
              <button className="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                Entidades
              </button>
              <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><Link className="dropdown-item" href="/admin/cards">Cartas</Link></li>
                <li><Link className="dropdown-item" href="/admin/customers">Clientes</Link></li>
                <li><Link className="dropdown-item" href="/admin/orders">Órdenes</Link></li>
                <li><Link className="dropdown-item" href="/admin/stores">Tiendas</Link></li>
              </ul>
            </div>
            <Link href="/admin/import" className="btn btn-outline-success btn-sm">Importar Excel</Link>
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