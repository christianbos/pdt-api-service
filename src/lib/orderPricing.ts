import { Store } from '@/types/store'
import { ProductType, OrderItem, CLIENT_PRICING } from '@/types/order'

export class OrderPricingService {
  /**
   * Calcula el precio de un producto para una tienda específica o cliente directo
   */
  static getProductPrice(productType: ProductType, store?: Store): number {
    // Si no hay tienda, usar precios de cliente directo
    if (!store) {
      const price = CLIENT_PRICING[productType]
      if (typeof price !== 'number' || isNaN(price)) {
        throw new Error(`Invalid client pricing for product type: ${productType}`)
      }
      return price
    }

    // Usar precios específicos de la tienda
    let price: number
    if (productType === 'grading') {
      price = store.gradingPrice
      // Fallback para tiendas creadas con el sistema anterior
      if (typeof price !== 'number' || isNaN(price)) {
        console.warn(`Store ${store.name} missing gradingPrice, using default`)
        price = 280 // Valor por defecto
      }
    } else if (productType === 'mysterypack') {
      price = store.mysteryPackPrice
      // Fallback para tiendas creadas con el sistema anterior  
      if (typeof price !== 'number' || isNaN(price)) {
        console.warn(`Store ${store.name} missing mysteryPackPrice, using default`)
        price = 120 // Valor por defecto
      }
    } else {
      throw new Error(`Unknown product type: ${productType}`)
    }

    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      throw new Error(`Invalid store pricing for ${productType}: ${price}`)
    }

    return price
  }

  /**
   * Calcula el total de una orden
   */
  static calculateOrderTotal(items: OrderItem[]): number {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array')
    }
    
    return items.reduce((total, item) => {
      if (!item || typeof item.subtotal !== 'number' || isNaN(item.subtotal)) {
        console.warn('Invalid item subtotal:', item)
        return total
      }
      return total + item.subtotal
    }, 0)
  }

  /**
   * Crea un OrderItem con precio calculado automáticamente
   */
  static createOrderItem(
    productType: ProductType, 
    quantity: number, 
    store?: Store
  ): OrderItem {
    if (!productType || (productType !== 'grading' && productType !== 'mysterypack')) {
      throw new Error(`Invalid product type: ${productType}`)
    }
    
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity: ${quantity}`)
    }

    const unitPrice = this.getProductPrice(productType, store)
    const subtotal = unitPrice * quantity

    return {
      productType,
      quantity: Math.floor(quantity), // Asegurar que sea un entero
      unitPrice,
      subtotal
    }
  }

  /**
   * Valida que los precios en un OrderItem sean correctos
   */
  static validateOrderItem(item: OrderItem, store?: Store): boolean {
    const expectedPrice = this.getProductPrice(item.productType, store)
    const expectedSubtotal = expectedPrice * item.quantity

    return item.unitPrice === expectedPrice && item.subtotal === expectedSubtotal
  }
}