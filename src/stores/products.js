import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useProducts = defineStore('product-store', () => {
  const readJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  }

  const allProducts = ref(null)
  const notifications = ref([])
  const favorites = ref(readJson('favorites', []))
  const cart = ref(readJson('cart', []))
  const miniCartOpen = ref(false)

  function formatRating(value, decimals = 1) {
    const n = Number(value)
    if (!Number.isFinite(n)) return Number(0).toFixed(decimals)
    return n.toFixed(decimals)
  }

  function addNotification(message, type = 'success') {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    notifications.value.push({ id, message, type })
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }, 3000)
  }

  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function toggleFavorite(productId) {
    const index = favorites.value.indexOf(productId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(productId)
    }
    localStorage.setItem('favorites', JSON.stringify(favorites.value))
  }

  function addToCart(product, qty = 1) {
    const existingItem = cart.value.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += qty
    } else {
      cart.value.push({
        id: product.id,
        quantity: qty,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart.value))
    addNotification(`Added ${product.title} to basket!`)
    miniCartOpen.value = true
  }

  function removeFromCart(productId) {
    cart.value = cart.value.filter(item => item.id !== productId)
    localStorage.setItem('cart', JSON.stringify(cart.value))
  }

  function updateCartQuantity(productId, delta) {
    const item = cart.value.find(i => i.id === productId)
    if (item) {
      item.quantity += delta
      if (item.quantity <= 0) {
        removeFromCart(productId)
        addNotification('Item removed from basket', 'info')
      } else {
        localStorage.setItem('cart', JSON.stringify(cart.value))
        addNotification(`Updated ${item.title} quantity to ${item.quantity}`, 'info')
      }
    }
  }

  async function loadData() {
    if (allProducts.value) return
    try {
      const response = await fetch('https://dummyjson.com/products')
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)
      const json = await response.json()
      allProducts.value = Array.isArray(json.products) ? json.products : []
    } catch {
      allProducts.value = []
      addNotification('Could not load products. Please try again.', 'error')
    }
  }

  function getProductbyID(id) {
    if (!allProducts.value) return null
    const numericId = Number(id)
    if (!Number.isFinite(numericId)) return null
    return allProducts.value.find(p => p.id === numericId) || null
  }

  return {
    allProducts,
    loadData,
    getProductbyID,
    notifications,
    addNotification,
    formatRating,
    favorites,
    cart,
    miniCartOpen,
    toggleFavorite,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    removeNotification
  }
})
