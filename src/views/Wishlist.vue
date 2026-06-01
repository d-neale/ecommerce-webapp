<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useProducts } from '../stores/products.js'
import ProductContextMenu from '../components/ProductContextMenu.vue'

const productStore = useProducts()
const products = ref([])
const activeContextMenu = ref(null)
const contextMenuProduct = ref(null)

const itemsPerPage = ref('all')
const currentPage = ref(1)
const paginationOpen = ref(false)
const paginationMenu = ref(null)
const paginationOptions = [
  { value: 'all', label: 'Show All' },
  { value: 10, label: '10 per page' },
  { value: 20, label: '20 per page' },
  { value: 50, label: '50 per page' }
]

onMounted(async () => {
  await productStore.loadData()
  products.value = productStore.allProducts || []
  
  // Load itemsPerPage from localStorage
  const savedItemsPerPage = localStorage.getItem('itemsPerPage_wishlist')
  if (savedItemsPerPage) {
    itemsPerPage.value = savedItemsPerPage === 'all' ? 'all' : parseInt(savedItemsPerPage)
  }

  window.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleDocumentClick)
})

const favoriteProducts = computed(() => {
  return products.value.filter(p => productStore.favorites.includes(p.id))
})

const paginatedProducts = computed(() => {
  if (itemsPerPage.value === 'all') return favoriteProducts.value
  
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return favoriteProducts.value.slice(start, end)
})

const totalPages = computed(() => {
  if (itemsPerPage.value === 'all') return 1
  return Math.ceil(favoriteProducts.value.length / itemsPerPage.value)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const isFavorited = (productId) => {
  return productStore.favorites.includes(productId)
}

const toggleFavorite = (productId) => {
  productStore.toggleFavorite(productId)
}

const addToCart = (product) => {
  productStore.addToCart(product)
}

const handleContextMenu = (e, product) => {
  contextMenuProduct.value = product
  setTimeout(() => {
    if (activeContextMenu.value) {
      activeContextMenu.value.open(e)
    }
  }, 0)
}

const togglePaginationMenu = (event) => {
  event.stopPropagation()
  paginationOpen.value = !paginationOpen.value
}

const selectPaginationOption = (value) => {
  itemsPerPage.value = value
  currentPage.value = 1
  paginationOpen.value = false
  localStorage.setItem('itemsPerPage_wishlist', value)
}

const handleDocumentClick = (event) => {
  if (paginationMenu.value && !paginationMenu.value.contains(event.target)) {
    paginationOpen.value = false
  }
}

let pressTimer = null

const startTouch = (e, product) => {
  if (pressTimer) clearTimeout(pressTimer)
  
  pressTimer = setTimeout(() => {
    const touch = e.touches[0]
    const syntheticEvent = {
      preventDefault: () => {},
      clientX: touch.clientX,
      clientY: touch.clientY
    }
    handleContextMenu(syntheticEvent, product)
    pressTimer = null
  }, 600)
}

const endTouch = () => {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}
</script>

<template>
  <div class="wishlist-container">
    <header class="wishlist-header">
      <div class="header-content">
        <div class="header-left">
          <RouterLink to="/" class="back-button">
            <span class="back-text-long">← Back to Products</span>
            <span class="back-text-short">← Back</span>
          </RouterLink>
          <nav class="breadcrumbs">
            <RouterLink to="/">Home</RouterLink>
            <span class="separator">/</span>
            <span class="current">Wishlist</span>
          </nav>
        </div>
        <div class="header-right">
          <div v-if="favoriteProducts.length > 0" class="pagination-select" ref="paginationMenu">
            <button
              type="button"
              class="sort-trigger"
              @click="togglePaginationMenu"
              :aria-expanded="paginationOpen"
              aria-haspopup="listbox"
            >
              <span class="trigger-text">{{ paginationOptions.find(option => option.value === itemsPerPage)?.label || 'Show All' }}</span>
              <span class="sort-arrow">▾</span>
            </button>
            <div v-if="paginationOpen" class="sort-options" role="listbox">
              <button
                v-for="option in paginationOptions"
                :key="option.value"
                type="button"
                class="sort-option"
                :class="{ selected: option.value === itemsPerPage }"
                @click="selectPaginationOption(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="actions-wrapper">
            <RouterLink to="/cart" class="header-btn cart-link" title="View Cart">
              <span class="btn-icon">🛒</span>
              <span class="badge" v-if="productStore.cart.length > 0">{{ productStore.cart.length }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <ProductContextMenu 
      v-if="contextMenuProduct"
      ref="activeContextMenu"
      :product="contextMenuProduct"
      :isFavorited="isFavorited(contextMenuProduct.id)"
      @favorite="toggleFavorite"
      @addToCart="addToCart"
      @close="contextMenuProduct = null"
    />

    <main class="wishlist-main">
      <div v-if="favoriteProducts.length === 0" class="empty-wishlist">
        <div class="empty-illustration">
          <div class="illustration-circle"></div>
          <div class="empty-icon">♥</div>
        </div>
        <h2>Your wishlist is empty</h2>
        <p>Go back to products and heart some items you like!</p>
        <RouterLink to="/" class="browse-button">Browse Products</RouterLink>
      </div>

      <div v-else class="products-grid">
        <div 
          v-for="p in paginatedProducts" 
          :key="p.id" 
          class="product-card"
          @contextmenu.prevent="handleContextMenu($event, p)"
          @touchstart="startTouch($event, p)"
          @touchend="endTouch"
          @touchmove="endTouch"
        >
          <RouterLink :to="'/product/' + p.id">
            <div class="product-image-container">
              <img :src="p.thumbnail" :alt="p.title" class="product-image" loading="lazy" decoding="async">
              
              <!-- Badge Group (Consistent with Home Page) -->
              <div class="product-badges">
                <span v-if="p.stock < 10 && p.stock > 0" class="badge-tag stock-tag">
                  Only {{ p.stock }} Left!
                </span>
                <span v-else-if="p.stock === 0" class="badge-tag out-of-stock-tag">
                  Out of Stock
                </span>
                <span v-if="Math.round(p.discountPercentage) > 0" class="badge-tag discount-tag">
                  -{{ Math.round(p.discountPercentage) }}%
                </span>
                <span v-if="p.rating >= 4.8" class="badge-tag best-seller-tag">
                  Best Seller
                </span>
              </div>
            </div>
            <div class="product-info">
              <h2 class="product-title">{{ p.title }}</h2>
              <div class="price-container">
                <p class="product-price">£{{ p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
                <p v-if="Math.round(p.discountPercentage) > 0" class="original-price">
                  £{{ (p.price / (1 - p.discountPercentage / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </p>
              </div>
              <p class="product-description">{{ p.description.length > 80 ? p.description.slice(0, 80) + '...' : p.description }}</p>
              <button 
                type="button"
                class="quick-add-btn"
                @click.prevent="addToCart(p)"
              >
                Quick Add to Basket
              </button>
            </div>
          </RouterLink>
          <button 
            type="button"
            class="favorite-btn favorited"
            @click="toggleFavorite(p.id)"
            title="Remove from wishlist"
          >
            ♥
          </button>
        </div>
      </div>

      <div v-if="itemsPerPage !== 'all' && totalPages > 1" class="pagination-controls">
        <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.wishlist-container {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.wishlist-main {
  width: 100%;
  max-width: 87.5rem;
  margin: 0 auto;
  padding: 1.5rem 1.875rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

header {
  padding: 0.75rem 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
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

  .pagination-select { flex: 1; min-width: 0; }
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
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #999;
}

.breadcrumbs a { color: #4db8ff; }
.breadcrumbs .separator { color: #555; font-size: 0.75rem; }
.breadcrumbs .current { color: #eee; font-weight: 500; }

.empty-wishlist {
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
  .empty-wishlist {
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18.75rem, 1fr));
  gap: 1.5rem;
  padding: 2rem 0;
}

/* Product Card Styling (Consistent with Home) */
.product-card {
  background-color: #2a2a2a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 0.125rem solid #424242;
  transition: all 0.3s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-0.3125rem);
  border-color: #555;
}

.product-image-container {
  aspect-ratio: 1;
  background-color: #333;
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product-badges {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  z-index: 2;
}

.badge-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
}

.stock-tag { background-color: #ff9800; color: #000; }
.discount-tag { background-color: #f44336; color: #fff; }
.best-seller-tag { background-color: #4caf50; color: #fff; }

.product-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.product-title {
  font-size: 1rem;
  margin: 0;
  color: #eee;
  line-height: 1.4;
  display: block;
  overflow: hidden;
  max-height: calc(1.4em * 2);
  min-height: calc(1.4em * 2);
}

.price-container {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #4db8ff;
  margin: 0;
}

.original-price {
  font-size: 0.875rem;
  color: #666;
  text-decoration: line-through;
}

.product-description {
  font-size: 0.8125rem;
  color: #999;
  line-height: 1.4;
  height: 2.25rem;
  overflow: hidden;
}

.quick-add-btn {
  background-color: #333;
  border: 0.0625rem solid #565656;
  color: white;
  padding: 0.625rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.quick-add-btn:hover {
  background-color: #4db8ff;
  border-color: #4db8ff;
  color: #1a1a1a;
}

.favorite-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #ff6b6b;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  font-size: 1.25rem;
}

.sort-trigger {
  width: 100%;
  height: 2.75rem;
  background-color: #333333;
  border: 0.125rem solid #565656;
  border-radius: 0.5rem;
  padding: 0 0.75rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-options {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background-color: #2a2a2a;
  border: 0.125rem solid #565656;
  border-radius: 0.5rem;
  z-index: 110;
  overflow: hidden;
}

.sort-option {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
}

.sort-option:hover { background-color: #3a3a3a; }
.sort-option.selected { background-color: #4db8ff; color: #1a1a1a; }

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 0;
}

.page-btn {
  background-color: #333;
  border: 0.0625rem solid #565656;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
