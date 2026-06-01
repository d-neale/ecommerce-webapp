<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { RouterView } from 'vue-router'
import { useProducts } from './stores/products.js'

const productStore = useProducts()
const showBackToTop = ref(false)

const checkScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && productStore.miniCartOpen) {
    closeMiniCart()
  }
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const closeMiniCart = () => {
  productStore.miniCartOpen = false
}

const updateQuantity = (id, delta) => {
  productStore.updateCartQuantity(id, delta)
}

const cartTotal = computed(() => {
  return productStore.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const focusMainContent = () => {
  requestAnimationFrame(() => {
    document.getElementById('main-content')?.focus?.()
  })
}

onMounted(() => {
  checkScroll()
  window.addEventListener('scroll', checkScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkScroll)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Accessibility: allows keyboard users to jump past repeated header controls -->
  <a class="skip-link" href="#main-content" @click="focusMainContent">Skip to main content</a>
  <RouterView />
  
  <!-- Mini Cart Sidebar -->
  <transition name="slide-right">
    <div v-if="productStore.miniCartOpen" class="mini-cart-overlay" @click.self="closeMiniCart">
      <div class="mini-cart-sidebar">
        <div class="mini-cart-header">
          <h3>Shopping Basket</h3>
          <button class="close-sidebar" @click="closeMiniCart" aria-label="Close basket">✕</button>
        </div>

        <div v-if="productStore.cart.length === 0" class="mini-cart-empty">
          <span class="empty-icon">🛒</span>
          <p>Your basket is empty</p>
          <button class="continue-shopping" @click="closeMiniCart">Continue Shopping</button>
        </div>

        <div v-else class="mini-cart-items">
          <div v-for="item in productStore.cart" :key="item.id" class="mini-item">
            <img :src="item.thumbnail" :alt="item.title" class="mini-thumb" loading="lazy" decoding="async">
            <div class="mini-info">
              <h4>{{ item.title }}</h4>
              <p class="mini-price">£{{ item.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
              <div class="mini-qty-controls">
                <button @click="updateQuantity(item.id, -1)" class="mini-qty-btn" :aria-label="`Decrease quantity for ${item.title}`">-</button>
                <span class="mini-qty-val">{{ item.quantity }}</span>
                <button @click="updateQuantity(item.id, 1)" class="mini-qty-btn" :aria-label="`Increase quantity for ${item.title}`">+</button>
              </div>
            </div>
            <button @click="productStore.removeFromCart(item.id)" class="mini-remove" :aria-label="`Remove ${item.title} from basket`">✕</button>
          </div>
        </div>

        <div v-if="productStore.cart.length > 0" class="mini-cart-footer">
          <div class="mini-total">
            <span>Subtotal</span>
            <span>£{{ cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <RouterLink to="/cart" class="view-cart-btn" @click="closeMiniCart">View Full Basket</RouterLink>
        </div>
      </div>
    </div>
  </transition>

  <!-- Global Notifications -->
  <div class="notifications-container" role="region" aria-label="Notifications" aria-live="polite" aria-relevant="additions">
    <transition-group name="toast">
      <div 
        v-for="note in productStore.notifications" 
        :key="note.id" 
        class="notification-toast"
        :class="note.type"
      >
        <span class="toast-icon">
          {{ note.type === 'success' ? '✅' : note.type === 'error' ? '⚠️' : 'ℹ️' }}
        </span>
        <span class="toast-message">{{ note.message }}</span>
        <button
          type="button"
          class="toast-close"
          aria-label="Dismiss notification"
          @click.stop="productStore.removeNotification(note.id)"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
  
  <transition name="fade">
    <button 
      v-if="showBackToTop" 
      class="back-to-top" 
      @click="scrollToTop"
      title="Back to Top"
      aria-label="Back to Top"
    >
      ↑
    </button>
  </transition>
</template>

<style scoped>
.notifications-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 11000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.notification-toast {
  pointer-events: auto;
  min-width: min(18rem, calc(100vw - 2.5rem));
  max-width: min(25rem, calc(100vw - 2.5rem));
  background-color: #2a2a2a;
  color: white;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 0.125rem solid #424242;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(0.5rem);
}

.notification-toast.success { border-color: #4db8ff; }
.notification-toast.error { border-color: #ff6b6b; }
.notification-toast.info { border-color: #ffb400; }

.toast-icon { font-size: 1.25rem; }
.toast-message { font-size: 0.9375rem; font-weight: 500; flex: 1; min-width: 0; overflow-wrap: anywhere; }

.toast-close {
  background: none;
  border: none;
  color: #999;
  font-size: 1.125rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  flex: 0 0 auto;
}

.toast-close:active {
  transform: scale(0.95);
}

/* Mini Cart Sidebar Styles */
.mini-cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  display: flex;
  justify-content: flex-end;
  backdrop-filter: blur(0.25rem);
}

.mini-cart-sidebar {
  width: 100%;
  max-width: 25rem;
  height: 100%;
  background-color: #1a1a1a;
  border-left: 0.125rem solid #424242;
  display: flex;
  flex-direction: column;
  box-shadow: -1rem 0 3rem rgba(0, 0, 0, 0.5);
}

.mini-cart-header {
  padding: 1.5rem;
  border-bottom: 0.0625rem solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mini-cart-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #4db8ff;
}

.close-sidebar {
  background: none;
  border: none;
  color: #999;
  font-size: 1.25rem;
  cursor: pointer;
}

.mini-cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mini-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #2a2a2a;
  border-radius: 0.5rem;
  border: 0.0625rem solid #333;
  position: relative;
}

.mini-thumb {
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 0.375rem;
  background-color: #333;
}

.mini-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mini-info h4 {
  margin: 0;
  font-size: 0.875rem;
  color: white;
  padding-right: 1.5rem;
}

.mini-price {
  color: #4db8ff;
  font-weight: 700;
  font-size: 0.875rem;
  margin: 0;
}

.mini-qty-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.mini-qty-btn {
  background-color: #333;
  border: 0.0625rem solid #444;
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-qty-val {
  font-size: 0.875rem;
  font-weight: 600;
}

.mini-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
}

.mini-remove:hover { color: #ff6b6b; }

.mini-cart-footer {
  padding: 1.5rem;
  border-top: 0.0625rem solid #333;
  background-color: #222;
}

.mini-total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  margin-bottom: 1.25rem;
  font-size: 1.125rem;
}

.view-cart-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #4db8ff 0%, #2a9dd8 100%);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 700;
}

.mini-cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #666;
}

.mini-cart-empty .empty-icon { font-size: 4rem; }

.continue-shopping {
  background: none;
  border: 0.0625rem solid #4db8ff;
  color: #4db8ff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

/* Sidebar Animation */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Toast Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.back-to-top {
  position: fixed;
  bottom: 5rem; /* Above the footer */
  right: 1.875rem;
  width: 3rem;
  height: 3rem;
  background-color: #4db8ff;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.4);
  z-index: 1000;
  transition: all 0.3s ease;
}

.back-to-top:hover {
  background-color: #3a9dd8;
  transform: translateY(-0.3125rem);
}

.back-to-top:active {
  transform: scale(0.9);
}

.fade-enter-active,
.skip-link {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 3000;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  background-color: #4db8ff;
  color: #0b0b0b;
  font-weight: 700;
  transform: translateY(-200%);
  transition: transform 0.15s ease;
}

.skip-link:focus-visible {
  transform: translateY(0);
  outline: 0.125rem solid #fff;
  outline-offset: 0.125rem;
}

.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}


.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(1.25rem);
}

@media (max-width: 48rem) {
  .notifications-container {
    top: auto;
    bottom: 5rem;
    left: 1.25rem;
    right: 1.25rem;
    align-items: center;
  }
  
  .notification-toast {
    min-width: 0;
    width: 100%;
  }

  .back-to-top {
    bottom: 4.5rem;
    right: 1rem;
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>
