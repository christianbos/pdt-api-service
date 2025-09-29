'use client'

import { OrderStatus, ORDER_STATUS_METADATA } from '@/types/order'

interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const metadata = ORDER_STATUS_METADATA[status]
  
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-secondary'
      case 'received': return 'bg-info'
      case 'processing': return 'bg-warning text-dark'
      case 'encapsulated': return 'bg-primary'
      case 'completed': return 'bg-success'
      case 'shipped': return 'bg-dark'
      case 'delivered': return 'bg-success'
      default: return 'bg-secondary'
    }
  }

  const sizeClass = size === 'sm' ? 'badge' : 'badge fs-6'

  return (
    <span 
      className={`${sizeClass} ${getStatusColor(status)}`}
      title={metadata.description}
    >
      {metadata.title}
    </span>
  )
}