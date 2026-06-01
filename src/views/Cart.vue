<script setup>
import { computed } from 'vue'
import { useProducts } from '../stores/products.js'

const productStore = useProducts()

const cartItems = computed(() => productStore.cart)

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const updateQuantity = (productId, delta) => {
  productStore.updateCartQuantity(productId, delta)
}

const removeItem = (productId) => {
  productStore.removeFromCart(productId)
}

const checkout = () => {
  productStore.addNotification('Thank you for your order! Your purchase was successful.', 'success')
  productStore.cart = []
  localStorage.removeItem('cart')
}
</script>

<template>
  <div class="cart-container">
    <header class="cart-header">
      <div class="header-content">
        <div class="header-left">
          <RouterLink to="/" class="back-button">
            <span class="back-text-long">← Back to Products</span>
            <span class="back-text-short">← Back</span>
          </RouterLink>
          <nav class="breadcrumbs">
            <RouterLink to="/">Home</RouterLink>
            <span class="separator">/</span>
            <span class="current">Shopping Cart</span>
          </nav>
        </div>
        <div class="header-right">
          <div class="actions-wrapper">
            <RouterLink to="/wishlist" class="header-btn wishlist-link" title="View Wishlist">
              <span class="btn-icon">♥</span>
              <span class="badge" v-if="productStore.favorites.length > 0">{{ productStore.favorites.length }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main class="cart-main">
      <div v-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-illustration">
          <div class="illustration-circle"></div>
          <div class="empty-icon">🛒</div>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <RouterLink to="/" class="browse-button">Start Shopping</RouterLink>
      </div>

      <div v-else class="cart-content">
        <div class="cart-items-list">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="item-image">
              <img :src="item.thumbnail" :alt="item.title" class="cart-thumb" loading="lazy" decoding="async">
            </div>
            <div class="item-info">
              <h3>{{ item.title }}</h3>
              <p class="item-price">£{{ item.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
            </div>
            <div class="item-quantity">
              <button type="button" @click="updateQuantity(item.id, -1)" class="qty-btn">-</button>
              <span class="qty-value">{{ item.quantity }}</span>
              <button type="button" @click="updateQuantity(item.id, 1)" class="qty-btn" :disabled="item.quantity >= (item.stock || 99)">+</button>
            </div>
            <div class="item-total">
              £{{ (item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
            </div>
            <button type="button" @click="removeItem(item.id)" class="remove-btn" title="Remove item">✕</button>
          </div>
        </div>

        <div class="cart-summary">
          <h2>Order Summary</h2>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>£{{ totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <span>£{{ totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <button type="button" @click="checkout" class="checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.cart-container {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.cart-main {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 87.5rem;
  margin: 0 auto;
  padding: 1.5rem 1.875rem;
}

header {
  padding: 0.75rem 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
}

.back-text-short { display: none; }

@media (max-width: 48rem) {
  .back-text-long { display: none; }
  .back-text-short { display: inline; }

  .header-content {
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    gap: 0.75rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    width: auto;
  }

  .header-left { flex: 1; min-width: 0; }

  .actions-wrapper { width: auto; justify-content: flex-end; }

  .actions-wrapper .header-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }

  .breadcrumbs {
    flex: 1;
    min-width: 0;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    gap: 0.375rem;
    font-size: 0.8125rem;
  }

  .breadcrumbs a,
  .breadcrumbs .current,
  .breadcrumbs .separator {
    white-space: nowrap;
  }

  .cart-item {
    padding: 1rem;
    gap: 0.75rem;
  }

  .item-image {
    width: 4rem;
    height: 4rem;
  }

  .item-info {
    min-width: 0;
  }

  .item-info h3 {
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #999;
}

.breadcrumbs a {
  color: #4db8ff;
}

.breadcrumbs .separator {
  color: #555;
  font-size: 0.75rem;
}

.breadcrumbs .current {
  color: #eee;
  font-weight: 500;
}

.empty-cart {
  text-align: center;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  justify-content: center;
}

@media (max-width: 48rem) {
  .empty-cart {
    justify-content: flex-start;
    padding-top: 1.5rem;
    gap: 1rem;
  }

  .empty-illustration {
    width: 7rem;
    height: 7rem;
  }

  .empty-icon {
    font-size: 3.5rem;
  }
}

.browse-button {
  width: 100%;
  max-width: 20rem;
  margin: 0 auto;
}

.empty-illustration {
  position: relative;
  width: 10rem;
  height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse-glow-heart 3s infinite ease-in-out;
}

.empty-icon {
  font-size: 5rem;
  color: #ff6b6b;
  z-index: 1;
}

@keyframes pulse-glow-heart {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.cart-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 21.875rem;
  gap: 2.5rem;
  align-items: start;
  width: 100%;
  min-width: 0;
}

.cart-items-list {
  background-color: #2a2a2a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 0.125rem solid #424242;
  min-width: 0;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 0.0625rem solid #424242;
  gap: 1.25rem;
  min-width: 0;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 5rem;
  height: 5rem;
  background-color: #333;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 0.0625rem solid #424242;
}

.cart-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h3 {
  color: white;
  margin: 0 0 0.3125rem 0;
  font-size: 1.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price {
  color: #4db8ff;
  font-weight: 700;
  margin: 0;
}

.item-quantity {
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 0.5rem;
  padding: 0.3125rem;
  border: 0.0625rem solid #565656;
}

.qty-btn {
  background: none;
  border: none;
  color: white;
  width: 1.875rem;
  height: 1.875rem;
  cursor: pointer;
  font-size: 1.125rem;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-value {
  color: white;
  width: 1.875rem;
  text-align: center;
  font-weight: 600;
}

.item-total {
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  width: 6.25rem;
  text-align: right;
}

.remove-btn {
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  font-size: 1.125rem;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #ff6b6b;
}

.cart-summary {
  background-color: #2a2a2a;
  border-radius: 0.75rem;
  padding: 1.5625rem;
  border: 0.125rem solid #424242;
  color: white;
  min-width: 0;
}

.cart-summary h2 {
  margin: 0 0 1.25rem 0;
  font-size: 1.375rem;
  border-bottom: 0.0625rem solid #424242;
  padding-bottom: 0.9375rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.9375rem;
  color: #b3b3b3;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 0.0625rem solid #424242;
  font-size: 1.25rem;
  font-weight: 800;
  color: #4db8ff;
}

.checkout-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.95rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #4db8ff 0%, #2a9dd8 100%);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.checkout-btn:hover {
  background: linear-gradient(135deg, #5fc2ff 0%, #3aa8e0 100%);
}

@media (max-width: 62rem) {
  .cart-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 30rem) {
  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9375rem;
  }

  .item-total {
    width: 100%;
    text-align: left;
    margin-top: 0.3125rem;
  }

  .remove-btn {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
  }

  .cart-item {
    position: relative;
  }
}
</style>
