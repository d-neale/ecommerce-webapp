<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProducts } from '../stores/products.js'

const route = useRoute()
const router = useRouter()
const productStore = useProducts()

const product = ref(null)
const loading = ref(true)
const quantity = ref(1)
const activeImageIndex = ref(0)
const showLightbox = ref(false)

// Review Sorting & Filtering
const reviewSortBy = ref('newest')
const reviewFilterRating = ref('all')
const reviewSortOpen = ref(false)
const reviewFilterOpen = ref(false)
const reviewSortMenu = ref(null)
const reviewFilterMenu = ref(null)
const reviewSortMenuStyle = ref({})
const reviewFilterMenuStyle = ref({})
const reviewSortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' }
]
const reviewFilterOptions = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' }
]

const filteredAndSortedReviews = computed(() => {
  if (!product.value || !product.value.reviews) return []
  
  let reviews = [...product.value.reviews]
  
  // Filter by rating
  if (reviewFilterRating.value !== 'all') {
    reviews = reviews.filter(r => r.rating === parseInt(reviewFilterRating.value))
  }
  
  // Sort
  if (reviewSortBy.value === 'newest') {
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date))
  } else if (reviewSortBy.value === 'highest') {
    reviews.sort((a, b) => b.rating - a.rating)
  } else if (reviewSortBy.value === 'lowest') {
    reviews.sort((a, b) => a.rating - b.rating)
  }
  
  return reviews
})

const youMayAlsoLike = computed(() => {
  if (!productStore.allProducts || !product.value) return []

  const sameCategory = productStore.allProducts
    .filter(p => p.id !== product.value.id && p.category === product.value.category)
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))

  const picks = sameCategory.slice(0, 4)
  if (picks.length === 4) return picks

  const fallback = productStore.allProducts
    .filter(p => p.id !== product.value.id && !picks.some(x => x.id === p.id))
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))

  return [...picks, ...fallback].slice(0, 4)
})

const addToCart = () => {
  if (!product.value) return
  productStore.addToCart(product.value, quantity.value)
}

const toggleFavorite = () => {
  if (!product.value) return
  productStore.toggleFavorite(product.value.id)
}

const isFavorited = computed(() => {
  return product.value ? productStore.favorites.includes(product.value.id) : false
})

const productCode = computed(() => {
  const p = product.value
  if (!p) return ''
  return p.sku || p.meta?.barcode || String(p.id || '')
})

const productInfoRows = computed(() => {
  const p = product.value
  if (!p) return []

  const rows = []
  const push = (label, value) => {
    if (value === undefined || value === null) return
    const v = String(value).trim()
    if (!v) return
    rows.push({ label, value: v })
  }

  push('Product Code', p.sku || p.id)
  push('Brand', p.brand)
  push('Category', p.category)
  push('Availability', p.availabilityStatus)
  push('Stock', Number.isFinite(Number(p.stock)) ? String(p.stock) : p.stock)
  push('Weight', p.weight)

  if (p.dimensions && (p.dimensions.width || p.dimensions.height || p.dimensions.depth)) {
    const w = p.dimensions.width ?? ''
    const h = p.dimensions.height ?? ''
    const d = p.dimensions.depth ?? ''
    push('Dimensions', `${w}×${h}×${d}`)
  }

  if (Array.isArray(p.tags) && p.tags.length > 0) {
    push('Tags', p.tags.join(', '))
  }

  push('Warranty', p.warrantyInformation)
  push('Shipping', p.shippingInformation)
  push('Return Policy', p.returnPolicy)
  push('Minimum Order', p.minimumOrderQuantity)

  push('Barcode', p.meta?.barcode)
  push('Updated', p.meta?.updatedAt)
  push('Created', p.meta?.createdAt)

  return rows
})

const addToRecentlyViewed = (prod) => {
  let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
  viewed = viewed.filter(p => p.id !== prod.id)
  viewed.unshift({
    id: prod.id,
    title: prod.title,
    thumbnail: prod.thumbnail,
    price: prod.price
  })
  viewed = viewed.slice(0, 10)
  localStorage.setItem('recentlyViewed', JSON.stringify(viewed))
}

const loadProduct = async () => {
  loading.value = true
  const id = parseInt(route.params.id)
  await productStore.loadData()
  const found = productStore.getProductbyID(id)
  if (found) {
    product.value = found
    addToRecentlyViewed(found)
    activeImageIndex.value = 0
  }
  loading.value = false
}

onMounted(loadProduct)

const handleReviewDocumentClick = (event) => {
  if (reviewSortMenu.value && !reviewSortMenu.value.contains(event.target)) {
    reviewSortOpen.value = false
  }
  if (reviewFilterMenu.value && !reviewFilterMenu.value.contains(event.target)) {
    reviewFilterOpen.value = false
  }
}

const closeReviewMenus = () => {
  reviewSortOpen.value = false
  reviewFilterOpen.value = false
}

const pxToRem = (px) => {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return `${px / rootFontSize}rem`
}

// Use fixed positioning so review dropdowns align to the trigger and avoid nested scrollbars
const positionReviewMenu = (containerRef, styleRef) => {
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const width = rect.width
  let left = rect.left
  const edgeGap = 0.5 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
  if (left + width > window.innerWidth - edgeGap) {
    left = Math.max(edgeGap, window.innerWidth - width - edgeGap)
  }

  const gap = edgeGap
  const top = rect.bottom + gap
  const maxHeight = Math.max(10 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16), window.innerHeight - top - edgeGap)

  styleRef.value = {
    position: 'fixed',
    top: pxToRem(top),
    left: pxToRem(left),
    width: pxToRem(width),
    maxHeight: pxToRem(maxHeight)
  }
}

const toggleReviewSortMenu = (event) => {
  event.stopPropagation()
  reviewSortOpen.value = !reviewSortOpen.value
  if (reviewSortOpen.value) {
    reviewFilterOpen.value = false
    nextTick(() => {
      positionReviewMenu(reviewSortMenu, reviewSortMenuStyle)
    })
  }
}

const toggleReviewFilterMenu = (event) => {
  event.stopPropagation()
  reviewFilterOpen.value = !reviewFilterOpen.value
  if (reviewFilterOpen.value) {
    reviewSortOpen.value = false
    nextTick(() => {
      positionReviewMenu(reviewFilterMenu, reviewFilterMenuStyle)
    })
  }
}

const selectReviewSort = (value) => {
  reviewSortBy.value = value
  reviewSortOpen.value = false
}

const selectReviewFilter = (value) => {
  reviewFilterRating.value = value
  reviewFilterOpen.value = false
}

onMounted(() => {
  window.addEventListener('click', handleReviewDocumentClick)
  window.addEventListener('scroll', closeReviewMenus, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleReviewDocumentClick)
  window.removeEventListener('scroll', closeReviewMenus)
  window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (event) => {
  if (event.key !== 'Escape') return
  closeReviewMenus()
  showLightbox.value = false
}

// Watch for route changes to reload product
watch(() => route.params.id, loadProduct)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="loader"></div>
    <p>Loading Product Details...</p>
  </div>
  
  <div v-else-if="!product" class="error-state">
    <h2>Product Not Found</h2>
    <p>The product you're looking for doesn't exist or has been removed.</p>
    <RouterLink to="/" class="back-home-btn">Return to Shop</RouterLink>
  </div>

  <div v-else class="product-page">
    <header class="detail-header">
      <div class="header-content-inner">
        <div class="header-left">
          <RouterLink to="/" class="back-button">
            <span class="back-text-long">← Back to Products</span>
            <span class="back-text-short">← Back</span>
          </RouterLink>
        </div>
        <div class="header-right">
          <RouterLink to="/wishlist" class="header-btn wishlist-link" title="View Wishlist">
            <span class="btn-icon">♥</span>
            <span class="badge" v-if="productStore.favorites.length > 0">{{ productStore.favorites.length }}</span>
          </RouterLink>
          <RouterLink to="/cart" class="header-btn cart-link" title="View Cart">
            <span class="btn-icon">🛒</span>
            <span class="badge" v-if="productStore.cart.length > 0">{{ productStore.cart.length }}</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <RouterLink to="/">Products</RouterLink>
      <span class="separator">/</span>
      <RouterLink :to="'/?category=' + product.category" class="category-link">
        {{ product.category.charAt(0).toUpperCase() + product.category.slice(1) }}
      </RouterLink>
      <span class="separator">/</span>
      <span class="current">{{ product.title }}</span>
    </nav>

    <div class="product-container">
      <!-- Image Gallery Section -->
      <div class="product-visuals">
        <div class="main-image-wrapper" @click="showLightbox = true">
          <img :src="product.images[activeImageIndex] || product.thumbnail" :alt="product.title" class="main-image" decoding="async">
          <div class="zoom-hint">🔍 Click to enlarge</div>
          
          <div class="product-badges-detail">
            <span v-if="product.stock < 10" class="badge-tag stock-tag">Only {{ product.stock }} Left!</span>
            <span v-if="Math.round(product.discountPercentage) > 0" class="badge-tag discount-tag">-{{ Math.round(product.discountPercentage) }}%</span>
          </div>
        </div>

        <div v-if="product.images && product.images.length > 1" class="image-thumbnails">
          <button 
            v-for="(img, index) in product.images" 
            :key="index"
            class="thumb-btn"
            :class="{ active: activeImageIndex === index }"
            @click="activeImageIndex = index"
          >
            <img :src="img" :alt="product.title + ' view ' + (index + 1)" loading="lazy" decoding="async">
          </button>
        </div>
      </div>

      <!-- Product Info Section -->
      <div class="product-info-detailed">
        <div class="info-header">
          <h1 class="product-title">{{ product.title }}</h1>
          <div class="meta-row">
            <span class="brand">{{ product.brand || 'Premium Collection' }}</span>
            <span v-if="productCode" class="product-code">{{ productCode }}</span>
            <div class="rating-summary">
              <span class="stars">⭐ {{ productStore.formatRating(product.rating) }}</span>
              <span class="review-count">({{ product.reviews?.length || 0 }} Reviews)</span>
            </div>
          </div>
        </div>

        <div class="detail-divider"></div>

        <div class="price-box">
          <div class="current-price">£{{ product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
          <div v-if="product.discountPercentage > 0" class="original-price">
            <span class="was-label">Was</span>
            <span class="was-price">£{{ (product.price / (1 - product.discountPercentage / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="stock-status" :class="{ 'low': product.stock < 10 }">
            {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock' }}
          </div>
        </div>

        <div class="detail-divider"></div>

        <div class="action-section">
          <div class="quantity-picker">
            <button @click="quantity > 1 && quantity--" :disabled="quantity <= 1">-</button>
            <span class="qty-display">{{ quantity }}</span>
            <button @click="quantity < product.stock && quantity++" :disabled="quantity >= product.stock">+</button>
          </div>
          
          <button 
            class="add-to-cart-btn" 
            @click="addToCart" 
            :disabled="product.stock === 0"
          >
            <span class="btn-icon">🛒</span>
            {{ product.stock === 0 ? 'Out of Stock' : 'Add to Basket' }}
          </button>

          <button 
            class="favorite-toggle-btn" 
            :class="{ active: isFavorited }"
            @click="toggleFavorite"
          >
            {{ isFavorited ? '❤️' : '🤍' }}
          </button>
        </div>

        <div class="detail-divider"></div>

        <div class="product-description">
          <h3>Description</h3>
          <p>{{ product.description }}</p>
        </div>

        <div class="detail-divider"></div>

        <div class="key-features">
          <div class="feature">
            <span class="feature-icon">🚚</span>
            <div class="feature-text">
              <strong>Free Delivery</strong>
              <span>On orders over £50</span>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🔄</span>
            <div class="feature-text">
              <strong>30-Day Returns</strong>
              <span>Easy, no-hassle returns</span>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🛡️</span>
            <div class="feature-text">
              <strong>Secure Payment</strong>
              <span>Encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="productInfoRows.length > 0" class="product-data">
        <h3>Product Information</h3>
        <div class="product-data-grid">
          <div v-for="row in productInfoRows" :key="row.label" class="data-row">
            <div class="data-label">{{ row.label }}</div>
            <div class="data-value">{{ row.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-divider"></div>

    <section v-if="youMayAlsoLike.length > 0" class="you-may-also-like">
      <div class="ymal-header">
        <h2>You may also like</h2>
        <span class="ymal-subtitle">Similar picks from this category</span>
      </div>
      <div class="ymal-row">
        <RouterLink
          v-for="p in youMayAlsoLike"
          :key="p.id"
          :to="'/product/' + p.id"
          class="ymal-card"
        >
          <div class="ymal-thumb">
            <img :src="p.thumbnail" :alt="p.title" loading="lazy" decoding="async">
          </div>
          <div class="ymal-info">
            <div class="ymal-title">{{ p.title }}</div>
            <div class="ymal-meta">
              <span class="ymal-price">£{{ p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
              <span class="ymal-rating">⭐ {{ productStore.formatRating(p.rating) }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Reviews Section -->
    <section class="reviews-section">
      <div class="section-header">
        <h2>Customer Reviews</h2>
        <div class="review-controls">
          <div class="review-select" ref="reviewFilterMenu">
            <button
              type="button"
              class="review-trigger"
              @click="toggleReviewFilterMenu"
              :aria-expanded="reviewFilterOpen"
              aria-haspopup="listbox"
            >
              <span class="review-trigger-text">{{ reviewFilterOptions.find(o => o.value === reviewFilterRating)?.label || 'All Ratings' }}</span>
              <span class="review-arrow">▾</span>
            </button>
            <div v-if="reviewFilterOpen" class="review-options" role="listbox" :style="reviewFilterMenuStyle">
              <button
                v-for="opt in reviewFilterOptions"
                :key="opt.value"
                type="button"
                class="review-option"
                :class="{ selected: opt.value === reviewFilterRating }"
                @click="selectReviewFilter(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="review-select" ref="reviewSortMenu">
            <button
              type="button"
              class="review-trigger"
              @click="toggleReviewSortMenu"
              :aria-expanded="reviewSortOpen"
              aria-haspopup="listbox"
            >
              <span class="review-trigger-text">{{ reviewSortOptions.find(o => o.value === reviewSortBy)?.label || 'Newest First' }}</span>
              <span class="review-arrow">▾</span>
            </button>
            <div v-if="reviewSortOpen" class="review-options" role="listbox" :style="reviewSortMenuStyle">
              <button
                v-for="opt in reviewSortOptions"
                :key="opt.value"
                type="button"
                class="review-option"
                :class="{ selected: opt.value === reviewSortBy }"
                @click="selectReviewSort(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredAndSortedReviews.length === 0" class="no-reviews">
        <p>No reviews match your selected criteria.</p>
      </div>
      
      <div v-else class="reviews-grid">
        <div v-for="(review, index) in filteredAndSortedReviews" :key="index" class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">{{ review.reviewerName.charAt(0) }}</div>
              <div>
                <div class="reviewer-name">{{ review.reviewerName }}</div>
                <div class="review-date">{{ formatDate(review.date) }}</div>
              </div>
            </div>
            <div class="review-rating">
              <span v-for="i in 5" :key="i" :class="{ filled: i <= review.rating }">★</span>
            </div>
          </div>
          <p class="review-comment">{{ review.comment }}</p>
        </div>
      </div>
    </section>

    <!-- Lightbox Overlay -->
    <transition name="fade">
      <div v-if="showLightbox" class="lightbox" @click="showLightbox = false">
        <button class="close-lightbox">✕</button>
        <img :src="product.images[activeImageIndex] || product.thumbnail" :alt="product.title" decoding="async">
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Layout */
.product-page {
  max-width: 100%;
  margin: 0;
  padding: 0 1.25rem 2rem;
  text-align: left;
}

/* Header */
.detail-header {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  padding: 1.25rem 0;
  margin: 0 -1.25rem 2rem;
  z-index: 100;
  border-bottom: 0.125rem solid #424242;
}

.header-content-inner {
  max-width: 100%;
  margin: 0;
  padding: 0 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 1rem;
}

.product-code {
  color: #666;
  font-size: 0.875rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  justify-self: center;
}

.product-data {
  background-color: #2a2a2a;
  border: 0.125rem solid #424242;
  border-radius: 0.75rem;
  padding: 1.25rem;
  align-self: flex-start;
  width: 100%;
  margin-top: 0.75rem;
}

.product-data h3 {
  margin: 0 0 1rem 0;
  color: #eee;
}

.product-data-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.data-row {
  display: flex;
  justify-content: flex-start;
  align-items: baseline;
  gap: 1rem;
}

.data-label {
  color: #888;
  font-size: 0.875rem;
  flex: 0 0 auto;
  min-width: 10rem;
}

.data-value {
  color: #eee;
  font-size: 0.875rem;
  text-align: left;
  min-width: 0;
}

.back-text-short { display: none; }

.back-text-long { white-space: nowrap; }
.back-button { white-space: nowrap; }

/* States */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 25rem;
  gap: 1.5rem;
}

.loader {
  width: 3.125rem;
  height: 3.125rem;
  border: 0.3125rem solid #333;
  border-top-color: #4db8ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Breadcrumbs */
.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
  font-size: 0.9rem;
  color: #888;
}

.breadcrumbs a {
  color: #4db8ff;
  transition: color 0.2s;
}

.breadcrumbs a:hover {
  color: #80ccff;
}

.separator {
  color: #444;
}

.current {
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Product Container */
.product-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  align-items: start;
  gap: 4rem;
  margin-bottom: 5rem;
}

.product-visuals {
  grid-column: 1;
  grid-row: 1;
}

.product-info-detailed {
  grid-column: 2;
  grid-row: 1 / span 2;
}

.product-data {
  grid-column: 1;
  grid-row: 2;
}

@media (max-width: 56.25rem) {
  .product-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 2.5rem;
  }

  .product-visuals,
  .product-info-detailed,
  .product-data {
    grid-column: auto;
    grid-row: auto;
  }

  .product-data {
    margin-top: 0.5rem;
  }
}

/* Visuals */
.product-visuals {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.main-image-wrapper {
  position: relative;
  background-color: #2a2a2a;
  border-radius: 1rem;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: zoom-in;
  border: 0.125rem solid #424242;
  padding: 0.75rem;
  transform: none;
  max-width: 100%;
}

.main-image-wrapper:hover,
.main-image-wrapper:active {
  transform: none;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: filter 0.3s ease;
  display: block;
  max-width: 100%;
}

.main-image-wrapper:hover .main-image {
  filter: brightness(1.05);
}

.zoom-hint {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  pointer-events: none;
}

.image-thumbnails {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-top: 0.25rem;
  padding-bottom: 0.5rem;
  max-width: 100%;
  min-width: 0;
}

.thumb-btn {
  width: 5rem;
  height: 5rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  border: 0.125rem solid #424242;
  background-color: #2a2a2a;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-btn.active {
  border-color: #4db8ff;
  transform: translateY(-0.125rem);
}

@media (max-width: 30rem) {
  .product-page {
    padding: 0 0.875rem 2rem;
  }

  .detail-header {
    margin: 0 -0.875rem 2rem;
  }

  .main-image-wrapper {
    padding: 0.5rem;
  }

  .image-thumbnails {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(3.5rem, 1fr));
    gap: 0.5rem;
    overflow-x: hidden;
    padding-bottom: 0;
  }

  .thumb-btn {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
}

/* Badges */
.product-badges-detail {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: calc(100% - 2rem);
  pointer-events: none;
}

.badge-tag {
  padding: 0.4rem 0.8rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 0.25rem 0.625rem rgba(0, 0, 0, 0.3);
}

.stock-tag { background-color: #ff9800; color: #000; }
.discount-tag { background-color: #f44336; color: #fff; }

/* Info Detailed */
.product-info-detailed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  margin: 0 0 0.25rem 0;
  padding: 0;
  display: block;
  overflow: visible;
  max-height: none;
  min-height: 0;
}

.meta-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  margin-top: 0;
  gap: 0.5rem;
}

.brand {
  font-size: 1.1rem;
  color: #aaa;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-row > .brand {
  justify-self: start;
}

.meta-row > .product-code {
  justify-self: center;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  justify-self: end;
  white-space: nowrap;
}

.stars { color: #ffc107; font-weight: 700; }
.review-count { color: #666; font-size: 0.9rem; }

.detail-divider {
  height: 0.0625rem;
  background-color: #333;
  width: 100%;
}

@media (max-width: 48rem) {
  .meta-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
    margin-top: 0;
    gap: 0.125rem;
  }

  .meta-row > .brand,
  .meta-row > .product-code,
  .meta-row > .rating-summary {
    justify-self: start;
  }

  .brand,
  .product-code,
  .rating-summary {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .product-code {
    text-align: left;
  }

  .rating-summary {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

.price-box {
  background-color: #2a2a2a;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 0.0625rem solid #424242;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.current-price {
  font-size: 2.25rem;
  font-weight: 800;
  color: #4db8ff;
}

.original-price {
  color: #666;
  font-size: 1.1rem;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.was-label {
  color: #777;
  font-weight: 700;
}

.was-price {
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

.stock-status {
  font-size: 0.9rem;
  color: #4caf50;
  font-weight: 600;
}

.stock-status.low { color: #ff9800; }

.action-section {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.quantity-picker {
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 0.0625rem solid #565656;
}

.qty-btn, .quantity-picker button {
  background: none;
  border: none;
  color: white;
  width: 2.5rem;
  height: 3rem;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.qty-btn:hover, .quantity-picker button:hover {
  background-color: #444;
}

.qty-display {
  width: 2.5rem;
  text-align: center;
  font-weight: 700;
}

.add-to-cart-btn {
  flex: 1;
  height: 3rem;
  background-color: #4db8ff;
  border: none;
  border-radius: 0.5rem;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #80ccff;
  transform: translateY(-0.125rem);
  box-shadow: 0 0.25rem 0.9375rem rgba(77, 184, 255, 0.4);
}

.add-to-cart-btn:disabled {
  background-color: #444;
  color: #888;
  cursor: not-allowed;
}

.favorite-toggle-btn {
  width: 3rem;
  height: 3rem;
  background-color: #333;
  border: 0.0625rem solid #565656;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.favorite-toggle-btn:active {
  transform: scale(0.97);
}

@media (hover: hover) {
  .favorite-toggle-btn:hover {
    background-color: #3a3a3a;
    border-color: #777;
    transform: translateY(-0.125rem);
  }
}

.favorite-toggle-btn.active {
  background-color: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.key-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.375rem, 1fr));
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 0.0625rem solid #333;
}

.feature {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.feature-icon { font-size: 1.5rem; }
.feature-text { display: flex; flex-direction: column; gap: 0.2rem; }
.feature-text strong { font-size: 0.85rem; }
.feature-text span { font-size: 0.75rem; color: #888; }

.you-may-also-like {
  padding-top: 3rem;
}

.ymal-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.ymal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  overflow-wrap: anywhere;
}

.ymal-subtitle {
  color: #777;
  font-size: 0.875rem;
  font-weight: 600;
  display: block;
  overflow-wrap: anywhere;
}

.ymal-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 56rem) {
  .ymal-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 40rem) {
  .ymal-header {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0.25rem;
  }

  .ymal-subtitle {
    width: 100%;
  }
}

.ymal-card {
  background-color: #2a2a2a;
  border: 0.0625rem solid #424242;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.ymal-card:hover {
  transform: translateY(-0.25rem);
  border-color: #4db8ff;
}

.ymal-thumb {
  width: 100%;
  aspect-ratio: 1;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ymal-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ymal-info {
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ymal-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #eee;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ymal-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.ymal-price {
  color: #4db8ff;
  font-weight: 800;
}

.ymal-rating {
  color: #ffc107;
  font-weight: 700;
}

/* Reviews */
.reviews-section {
  margin-top: 2rem;
  padding-top: 4rem;
  border-top: 0.125rem solid #333;
}

.reviews-section h2 {
  font-size: 1.75rem;
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.review-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.review-select {
  position: relative;
  flex: 1 1 11.5rem;
  min-width: 11.5rem;
  max-width: 100%;
}

@media (max-width: 40rem) {
  .review-select {
    flex-basis: 100%;
    min-width: 100%;
  }
}

.review-trigger {
  width: 100%;
  height: 2.75rem;
  background-color: #2a2a2a;
  border: 0.0625rem solid #424242;
  border-radius: 0.5rem;
  padding: 0 0.875rem;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.review-trigger:hover {
  border-color: #666;
}

.review-trigger-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  text-align: left;
}

.review-arrow {
  color: #999;
}

.review-options {
  position: fixed;
  background-color: #1a1a1a;
  border: 0.0625rem solid #424242;
  border-radius: 0.75rem;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 0.875rem 1.75rem rgba(0, 0, 0, 0.35);
  max-height: min(18rem, calc(100vh - 1rem));
  overflow-y: auto;
}

.review-option {
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.review-option:hover {
  background-color: #3a3a3a;
}

.review-option.selected {
  background-color: rgba(77, 184, 255, 0.15);
  color: #4db8ff;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18.75rem, 1fr));
  gap: 1.5rem;
}

.review-card {
  background-color: #2a2a2a;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 0.0625rem solid #424242;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.reviewer-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.reviewer-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #4db8ff;
  color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
}

.reviewer-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.review-date {
  font-size: 0.8rem;
  color: #666;
}

.review-rating { color: #444; }
.review-rating .filled { color: #ffc107; }

.review-comment {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #ccc;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 0.5rem;
}

.close-lightbox {
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>