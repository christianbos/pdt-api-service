'use client'

import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="h3 mb-0 fw-bold">Admin Dashboard</h1>
        <small className="text-muted">Selecciona una entidad para administrar</small>
      </div>
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Cartas</h5>
              <p className="card-text">Administrar las cartas gradadas.</p>
              <Link href="/admin/cards" className="btn btn-primary">Ir a Cartas</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Clientes</h5>
              <p className="card-text">Administrar la información de los clientes.</p>
              <Link href="/admin/customers" className="btn btn-primary">Ir a Clientes</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Órdenes</h5>
              <p className="card-text">Administrar las órdenes de los clientes.</p>
              <Link href="/admin/orders" className="btn btn-primary">Ir a Órdenes</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mt-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Tiendas</h5>
              <p className="card-text">Administrar las tiendas afiliadas.</p>
              <Link href="/admin/stores" className="btn btn-primary">Ir a Tiendas</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
