<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useProducts } from '../main.js'
import ProductContextMenu from './ProductContextMenu.vue'
import ProductSkeleton from './ProductSkeleton.vue'

const route = useRoute()
const productStore = useProducts()
const productList = ref(null)
const loading = ref(true)
const inputText = ref('')
const sortBy = ref('def')
const sortOpen = ref(false)
const sortMenu = ref(null)
const sortOptions = [
  { value: 'def', label: 'Sort by price...' },
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' }
]
const recentSearches = ref([])
const recentlyViewed = ref([])
const searchInput = ref(null)
const searchForm = ref(null)
const selectedCategory = ref('all')
const MAX_SEARCH_LENGTH = 30

// Advanced Filtering State
const showFilters = ref(false)
const minPrice = ref(0)
const maxPrice = ref(2000)
const selectedBrands = ref([])
const minRating = ref(0)

const categories = computed(() => {
  if (!productList.value) return ['all']
  const cats = productList.value.map(p => p.category)
  return ['all', ...new Set(cats)]
})

const compareList = ref(JSON.parse(localStorage.getItem('compareList') || '[]'))
const showCompareModal = ref(false)

watch(
  compareList,
  (val) => {
    if (!Array.isArray(val) || val.length === 0) {
      localStorage.removeItem('compareList')
      return
    }
    localStorage.setItem('compareList', JSON.stringify(val))
  },
  { deep: true }
)

const uniqueBrands = computed(() => {
  if (!productList.value) return []
  const brands = productList.value.map(p => p.brand).filter(b => b)
  return [...new Set(brands)].sort()
})

const toggleBrand = (brand) => {
  const index = selectedBrands.value.indexOf(brand)
  if (index === -1) {
    selectedBrands.value.push(brand)
  } else {
    selectedBrands.value.splice(index, 1)
  }
  currentPage.value = 1
}

const clearFilters = () => {
  minPrice.value = 0
  maxPrice.value = 2000
  selectedBrands.value = []
  minRating.value = 0
  currentPage.value = 1
}

const clearAllSearchAndFilters = () => {
  inputText.value = ''
  selectedCategory.value = 'all'
  clearFilters()
  searchOpen.value = false
}

const shareProduct = async (prod) => {
  const url = window.location.origin + '/product/' + prod.id
  const shareData = {
    title: prod.title,
    text: prod.description,
    url: url
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(url)
      productStore.addNotification('Link copied to clipboard!', 'success')
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      productStore.addNotification('Could not share product.', 'error')
    }
  }
}

const toggleCompare = (prod) => {
  const index = compareList.value.findIndex(p => p.id === prod.id)
  if (index === -1) {
    if (compareList.value.length >= 3) {
      productStore.addNotification('You can only compare up to 3 products at a time.', 'error')
      return
    }
    compareList.value.push({
      id: prod.id,
      title: prod.title,
      thumbnail: prod.thumbnail,
      price: prod.price,
      rating: prod.rating,
      brand: prod.brand,
      weight: prod.weight,
      category: prod.category
    })
  } else {
    compareList.value.splice(index, 1)
  }
}

const isComparing = (id) => compareList.value.some(p => p.id === id)

const clearCompare = () => {
  compareList.value = []
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
  localStorage.setItem('lastCategory', cat)
}

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

const showSuccess = ref(false)
const activeContextMenu = ref(null)
const contextMenuProduct = ref(null)

const searchOpen = ref(false)
const searchHistory = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))

const searchSuggestions = computed(() => {
  const q = inputText.value.trim().toLowerCase()
  if (q.length < 2 || !productList.value) return []
  return productList.value
    .filter(p => p.title.toLowerCase().includes(q))
    .slice(0, 5)
})

const showSearchDropdown = computed(() => {
  return (
    searchOpen.value &&
    (searchSuggestions.value.length > 0 || searchHistory.value.length > 0)
  )
})

const handleSearchFocus = () => {
  searchOpen.value = true
}

const handleSearchInput = () => {
  searchOpen.value = true
}

const selectSuggestion = (suggestion) => {
  inputText.value = suggestion.title
  searchOpen.value = false
  handleSearchSubmit()
}

const addToHistory = (query) => {
  let history = [...searchHistory.value]
  history = history.filter(h => h !== query)
  history.unshift(query)
  history = history.slice(0, 5)
  searchHistory.value = history
  localStorage.setItem('searchHistory', JSON.stringify(history))
}

const handleSearchSubmit = (e) => {
  if (e) e.preventDefault()
  const q = inputText.value.trim()
  if (q) {
    addToHistory(q)
    searchOpen.value = false
  }
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

const removeHistoryItem = (query) => {
  searchHistory.value = searchHistory.value.filter(h => h !== query)
  if (searchHistory.value.length === 0) {
    localStorage.removeItem('searchHistory')
    return
  }
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

const clearSearch = async (keepFocus = false) => {
  inputText.value = ''
  searchOpen.value = keepFocus
  await nextTick()
  if (keepFocus && searchInput.value) {
    searchInput.value.focus()
  }
}

const closeSortMenu = () => {
  sortOpen.value = false
}

const toggleSortMenu = (event) => {
  event.stopPropagation()
  sortOpen.value = !sortOpen.value
}

const selectSortOption = (value) => {
  sortBy.value = value
  sortOpen.value = false
  // Persist sort selection
  localStorage.setItem('lastSortBy', value)
}

const togglePaginationMenu = (event) => {
  event.stopPropagation()
  paginationOpen.value = !paginationOpen.value
}

const selectPaginationOption = (value) => {
  itemsPerPage.value = value
  currentPage.value = 1
  paginationOpen.value = false
  localStorage.setItem('itemsPerPage', value)
}

const handleDocumentClick = (event) => {
  if (sortMenu.value && !sortMenu.value.contains(event.target)) {
    closeSortMenu()
  }
  if (paginationMenu.value && !paginationMenu.value.contains(event.target)) {
    paginationOpen.value = false
  }
  const form = searchForm.value
  if (form && !form.contains(event.target)) {
    searchOpen.value = false
  }
}

const handleKeydown = (event) => {
  if (event.key !== 'Escape') return
  sortOpen.value = false
  paginationOpen.value = false
  searchOpen.value = false
  showFilters.value = false
  showCompareModal.value = false
  contextMenuProduct.value = null
}

const formatStock = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0 in stock'
  return `${n.toLocaleString('en-US')} in stock`
}

const toggleFavorite = (productId) => {
  productStore.toggleFavorite(productId)
}

const isFavorited = (productId) => {
  return productStore.favorites.includes(productId)
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

let pressTimer = null

// Long-press opens the context menu on touch devices
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

const isAtBottom = ref(false)
const isScrollable = ref(false)

let scrollCheckTimer = null
// Avoid stacking multiple scroll checks when reactive state changes quickly
const scheduleCheckScroll = (delay = 0) => {
  if (scrollCheckTimer) clearTimeout(scrollCheckTimer)
  scrollCheckTimer = setTimeout(checkScroll, delay)
}

const checkScroll = () => {
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = document.documentElement.clientHeight
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  
  isScrollable.value = scrollHeight > clientHeight + 10 // Small buffer
  isAtBottom.value = scrollTop + clientHeight >= scrollHeight - 50
}

let persistSearchTimer = null

const closeContextMenu = () => {
  contextMenuProduct.value = null
}

const addToCartFromMenu = () => {
  if (contextMenuProduct.value) {
    productStore.addToCart(contextMenuProduct.value)
    closeContextMenu()
  }
}

onMounted(async () => {
  loading.value = true
  await productStore.loadData()
  productList.value = productStore.allProducts || []
  loading.value = false
  
  // 1. Check for category in URL query first
  if (route.query.category) {
    selectedCategory.value = route.query.category
  } else {
    // 2. Otherwise restore from localStorage
    const savedCategory = localStorage.getItem('lastCategory')
    if (savedCategory) {
      selectedCategory.value = savedCategory
    }
  }

  // Load recent searches from localStorage
  const saved = localStorage.getItem('recentSearches')
  if (saved) {
    recentSearches.value = JSON.parse(saved)
  }

  const savedSearchText = localStorage.getItem('lastSearch')
  if (savedSearchText) {
    inputText.value = savedSearchText
  }

  window.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleKeydown)

  // Restore sort state
  const savedSort = localStorage.getItem('lastSortBy')
  if (savedSort) {
    sortBy.value = savedSort
  }

  // Load recently viewed
  const savedViewed = localStorage.getItem('recentlyViewed')
  if (savedViewed) {
    recentlyViewed.value = JSON.parse(savedViewed)
  }

  // Load itemsPerPage from localStorage
  const savedItemsPerPage = localStorage.getItem('itemsPerPage')
  if (savedItemsPerPage) {
    itemsPerPage.value = savedItemsPerPage === 'all' ? 'all' : parseInt(savedItemsPerPage)
  }

  window.addEventListener('scroll', checkScroll, { passive: true })
  window.addEventListener('resize', checkScroll)
  scheduleCheckScroll(50)
})

// Watch for category changes in the URL
watch(() => route.query.category, (newCategory) => {
  if (newCategory) {
    selectedCategory.value = newCategory
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', checkScroll)
  window.removeEventListener('resize', checkScroll)
  if (pressTimer) clearTimeout(pressTimer)
  if (scrollCheckTimer) clearTimeout(scrollCheckTimer)
  if (persistSearchTimer) clearTimeout(persistSearchTimer)
})

// computed list filtered by search and sorted by selection
const filteredProducts = computed(() => {
  const q = inputText.value.trim().toLowerCase()
  let items = Array.isArray(productList.value) ? productList.value.slice() : []

  if (selectedCategory.value !== 'all') {
    items = items.filter(p => p.category === selectedCategory.value)
  }

  // Brand filter
  if (selectedBrands.value.length > 0) {
    items = items.filter(p => selectedBrands.value.includes(p.brand))
  }

  // Price filter
  items = items.filter(p => p.price >= minPrice.value && p.price <= maxPrice.value)

  // Rating filter
  if (minRating.value > 0) {
    items = items.filter(p => p.rating >= minRating.value)
  }

  if (q) {
    items = items.filter(p => {
      return p.title && p.title.toLowerCase().includes(q)
    })
  }

  if (sortBy.value === 'asc') {
    items.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'desc') {
    items.sort((a, b) => b.price - a.price)
  }

  return items
})

const paginatedProducts = computed(() => {
  if (itemsPerPage.value === 'all') return filteredProducts.value
  
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

const totalPages = computed(() => {
  if (itemsPerPage.value === 'all') return 1
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

const recommendedProducts = computed(() => {
  if (!productList.value) return []
  // Get 4 random products
  return [...productList.value]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
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

// keep local copy in sync if store updates later
watch(() => productStore.allProducts, (val) => {
  productList.value = val || []
  scheduleCheckScroll(100)
})

// Persist search text as user types (even before Enter)
watch(inputText, (newVal) => {
  if (persistSearchTimer) clearTimeout(persistSearchTimer)
  persistSearchTimer = setTimeout(() => {
    localStorage.setItem('lastSearch', newVal)
  }, 200)
  scheduleCheckScroll(100)
})

// watch filtered products to update scroll state
watch(() => filteredProducts.value, () => {
  scheduleCheckScroll(100)
})

</script>

<template>
  <header>
    <div class="header-content">
      <h1>Products</h1>
      
      <div class="header-right">
        <form ref="searchForm" @submit="handleSearchSubmit" class="search-form">
          <div class="search-input-wrapper">
            <input 
            ref="searchInput"
            v-model="inputText" 
            @input="handleSearchInput"
            @focus="handleSearchFocus"
            :class="{ 'search-open': showSearchDropdown }"
            type="text" 
            id="textbox1"
            :maxlength="MAX_SEARCH_LENGTH"
            placeholder="Search by product name..."> 
            <button
              v-if="inputText.length > 0"
              type="button"
              class="clear-btn"
              title="Clear search"
              @mousedown.prevent.stop="clearSearch(true)"
              @click.prevent.stop="clearSearch(true)"
            >
              ✕
            </button>
            <span class="char-count">{{ inputText.length }}/{{ MAX_SEARCH_LENGTH }}</span>

            <!-- Search Dropdown -->
            <div v-if="showSearchDropdown" class="search-dropdown">
              <div v-if="searchSuggestions.length > 0" class="dropdown-section">
                <div class="section-title">Suggestions</div>
                <div 
                  v-for="s in searchSuggestions" 
                  :key="s.id" 
                  class="dropdown-item"
                  @mousedown="selectSuggestion(s)"
                >
                  <img :src="s.thumbnail" class="item-thumb" loading="lazy" decoding="async">
                  <span class="item-title">{{ s.title }}</span>
                </div>
              </div>

              <div v-if="searchHistory.length > 0" class="dropdown-section">
                <div class="section-header">
                  <div class="section-title">Recent Searches</div>
                  <button type="button" class="clear-history" @mousedown="clearHistory">Clear</button>
                </div>
                <div 
                  v-for="h in searchHistory" 
                  :key="h" 
                  class="dropdown-item history-item"
                  @mousedown="inputText = h; handleSearchSubmit()"
                >
                  <span class="history-icon">🕒</span>
                  <span class="item-title">{{ h }}</span>
                  <button
                    type="button"
                    class="history-remove"
                    title="Remove"
                    @mousedown.stop.prevent="removeHistoryItem(h)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div class="sort-select" ref="sortMenu">
          <button
            type="button"
            class="sort-trigger"
            @click="toggleSortMenu"
            :aria-expanded="sortOpen"
            aria-haspopup="listbox"
          >
            <span class="trigger-text">{{ sortOptions.find(option => option.value === sortBy)?.label || 'Sort by price...' }}</span>
            <span class="sort-arrow">▾</span>
          </button>
          <div v-if="sortOpen" class="sort-options" role="listbox">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="sort-option"
              :class="{ selected: option.value === sortBy }"
              @click="selectSortOption(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="pagination-select" ref="paginationMenu">
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
            <button 
              type="button"
              class="header-btn filter-toggle"
              :class="{ active: showFilters || selectedBrands.length > 0 || minPrice > 0 || maxPrice < 2000 || minRating > 0 }"
              @click="showFilters = !showFilters"
              title="Toggle Advanced Filters"
            >
              <span class="btn-icon">🔍</span>
              <span class="badge" v-if="selectedBrands.length > 0 || minPrice > 0 || maxPrice < 2000 || minRating > 0">!</span>
            </button>

            <button 
              type="button" 
              class="header-btn compare-btn" 
              :class="{ 'has-items': compareList.length > 0 }"
              @click="showCompareModal = true"
              title="Compare Products"
            >
              <span class="btn-icon">⚖️</span>
              <span class="badge" v-if="compareList.length > 0">{{ compareList.length }}</span>
            </button>

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
    </div>

    <div v-if="recentSearches.length > 0" class="recent-searches">
      <span class="recent-label">Recent Searches:</span>
      <div class="search-tags">
        <div v-for="(search, index) in recentSearches" :key="index" class="search-tag">
          <button type="button" class="tag-text" @click="selectRecentSearch(search)">
            {{ search }}
          </button>
          <button type="button" class="tag-remove" @click="removeSearch(index)" title="Remove">
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="category-filters">
      <button 
        v-for="cat in categories" 
        :key="cat"
        type="button"
        class="category-pill"
        :class="{ active: selectedCategory === cat }"
        @click="selectCategory(cat)"
      >
        {{ cat.charAt(0).toUpperCase() + cat.slice(1) }}
      </button>
    </div>

    <transition name="slide">
      <div v-if="showFilters" class="filter-panel">
        <div class="filter-section">
          <h3>Price Range</h3>
          <div class="price-inputs">
            <div class="price-field">
              <span>Min</span>
              <input type="number" v-model.number="minPrice" min="0" :max="maxPrice">
            </div>
            <div class="price-field">
              <span>Max</span>
              <input type="number" v-model.number="maxPrice" :min="minPrice">
            </div>
          </div>
          <input type="range" v-model.number="maxPrice" min="0" max="3000" class="price-slider">
        </div>

        <div class="filter-section">
          <h3>Minimum Rating</h3>
          <div class="rating-filter-options">
            <button 
              v-for="rating in [4, 3, 2]" 
              :key="rating"
              class="rating-chip"
              :class="{ active: minRating === rating }"
              @click="minRating = minRating === rating ? 0 : rating"
            >
              ⭐ {{ rating }}+ Stars
            </button>
          </div>
        </div>

        <div class="filter-section">
          <h3>Brands</h3>
          <div class="brand-grid">
            <button 
              v-for="brand in uniqueBrands" 
              :key="brand"
              class="brand-chip"
              :class="{ active: selectedBrands.includes(brand) }"
              @click="toggleBrand(brand)"
            >
              {{ brand }}
            </button>
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-filters-btn" @click="clearFilters">Clear All Filters</button>
        </div>
      </div>
    </transition>
  </header>

  <transition name="fade">
    <div v-if="showSuccess" class="success-message">
      Successfully added to cart!
    </div>
  </transition>

  <!-- Comparison Modal -->
  <transition name="fade">
    <div v-if="showCompareModal" class="compare-modal-overlay" @click.self="showCompareModal = false">
      <div class="compare-modal">
        <div class="compare-header">
          <h3>Compare Products</h3>
          <button class="close-modal" @click="showCompareModal = false">✕</button>
        </div>
        <div v-if="compareList.length === 0" class="compare-empty">
          <div class="empty-illustration">
            <div class="illustration-circle"></div>
            <div class="empty-icon">⚖️</div>
          </div>
          <p>Your comparison list is empty.</p>
          <p class="empty-subtitle">Add up to 3 products to compare their features side-by-side.</p>
          <button class="browse-button" @click="showCompareModal = false">Continue Browsing</button>
        </div>
        <div v-else class="compare-table-wrapper">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th v-for="p in compareList" :key="p.id">
                  <div class="compare-item-header">
                    <img :src="p.thumbnail" :alt="p.title" class="compare-thumb" loading="lazy" decoding="async">
                    <p>{{ p.title }}</p>
                    <button class="remove-compare" @click="toggleCompare(p)">Remove</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Price</td>
                <td v-for="p in compareList" :key="p.id" class="compare-price">
                  £{{ p.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
              </tr>
              <tr>
                <td>Rating</td>
                <td v-for="p in compareList" :key="p.id">⭐ {{ productStore.formatRating(p.rating) }} / 5</td>
              </tr>
              <tr>
                <td>Brand</td>
                <td v-for="p in compareList" :key="p.id">{{ p.brand || 'N/A' }}</td>
              </tr>
              <tr>
                <td>Category</td>
                <td v-for="p in compareList" :key="p.id" class="capitalize">{{ p.category }}</td>
              </tr>
              <tr>
                <td>Weight</td>
                <td v-for="p in compareList" :key="p.id">{{ p.weight }}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </transition>

  <ProductContextMenu 
    v-if="contextMenuProduct"
    ref="activeContextMenu"
    :product="contextMenuProduct"
    :isFavorited="isFavorited(contextMenuProduct.id)"
    @favorite="toggleFavorite"
    @addToCart="addToCart"
    @close="contextMenuProduct = null"
  />

  <main>
    <div class="products-grid">
      <template v-if="loading || !productList">
        <ProductSkeleton v-for="i in 8" :key="i" />
      </template>
      <template v-else>
        <transition name="fade" mode="out-in">
          <template v-if="filteredProducts.length === 0">
            <div class="no-results">
              <div class="no-results-content">
                <span class="no-results-icon">🔍</span>
                <h2>Oops! No results found</h2>
                <p v-if="inputText">No matches for "{{ inputText }}". Try checking your spelling or use more general keywords.</p>
                <p v-else>No products match your selected filters.</p>
                <div class="no-results-actions">
                  <button v-if="inputText" class="clear-search-btn secondary" @click="clearSearch">Clear Search Text</button>
                  <button class="clear-search-btn" @click="clearAllSearchAndFilters">Clear All Filters</button>
                </div>
              </div>
              
              <div class="smart-suggestions">
                <h3>Check out our top-rated items instead:</h3>
                <div class="suggestions-grid">
                  <RouterLink 
                    v-for="p in recommendedProducts" 
                    :key="p.id" 
                    :to="'/product/' + p.id"
                    class="suggestion-card"
                  >
                  <img :src="p.thumbnail" :alt="p.title" loading="lazy" decoding="async">
                    <div class="suggestion-info">
                      <h4>{{ p.title }}</h4>
                      <p>£{{ p.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
                    </div>
                  </RouterLink>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="products-grid-inner">
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
                  
                  <!-- Badge Group (Stock, Discount, Best Seller) -->
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
                  <div class="product-meta">
                    <span class="meta-pill product-rating">⭐ {{ productStore.formatRating(p.rating) }}</span>
                    <span class="meta-pill product-stock" :class="{ 'low-stock': p.stock < 10 }">
                      {{ formatStock(p.stock) }}
                    </span>
                  </div>
                </div>
              </RouterLink>
              <button 
                type="button"
                class="favorite-btn"
                :class="{ favorited: isFavorited(p.id) }"
                @click="toggleFavorite(p.id)"
                :title="isFavorited(p.id) ? 'Remove from favorites' : 'Add to favorites'"
              :aria-label="isFavorited(p.id) ? `Remove ${p.title} from favourites` : `Add ${p.title} to favourites`"
              >
                ♥
              </button>
              <button 
                type="button"
                class="compare-toggle-btn"
                :class="{ active: isComparing(p.id) }"
                @click="toggleCompare(p)"
                :title="isComparing(p.id) ? 'Remove from comparison' : 'Add to comparison'"
              :aria-label="isComparing(p.id) ? `Remove ${p.title} from comparison` : `Add ${p.title} to comparison`"
              >
                ⚖️
              </button>
              <button 
                type="button"
                class="share-card-btn"
                @click="shareProduct(p)"
                title="Share this product"
              :aria-label="`Share ${p.title}`"
              >
                📤
              </button>
            </div>
          </div>
        </transition>
      </template>
    </div>

    <div v-if="itemsPerPage !== 'all' && totalPages > 1" class="pagination-controls">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>

    <!-- Persistent Compare Bar -->
    <transition name="slide-up">
      <div v-if="compareList.length > 0 && !showCompareModal" class="compare-bar">
        <div class="compare-bar-content">
          <div class="compare-bar-info">
            <span class="compare-bar-icon">⚖️</span>
            <span class="compare-bar-text">Comparing <strong>{{ compareList.length }}</strong> {{ compareList.length === 1 ? 'item' : 'items' }}</span>
          </div>
          <div class="compare-bar-thumbs">
            <div v-for="p in compareList" :key="p.id" class="compare-bar-thumb-wrapper">
              <img :src="p.thumbnail" :alt="p.title" class="compare-bar-thumb" loading="lazy" decoding="async">
              <button class="compare-bar-remove" @click.stop="toggleCompare(p)">✕</button>
            </div>
          </div>
          <div class="compare-bar-actions">
            <button class="compare-bar-clear" @click="clearCompare">Clear All</button>
            <button class="compare-bar-view" @click="showCompareModal = true">Compare Now</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Recently Viewed Section -->
    <div v-if="recentlyViewed.length > 0" class="recently-viewed-section">
      <div class="section-header">
        <h3>Recently Viewed</h3>
        <span class="viewed-count">{{ recentlyViewed.length }} items</span>
      </div>
      <div v-if="recentlyViewed.length > 0" class="viewed-scroll-container">
        <div class="viewed-row">
          <RouterLink 
            v-for="p in recentlyViewed" 
            :key="p.id" 
            :to="'/product/' + p.id"
            class="viewed-card"
          >
            <div class="viewed-thumb-wrapper">
              <img :src="p.thumbnail" :alt="p.title" class="viewed-thumb" loading="lazy" decoding="async">
            </div>
            <div class="viewed-info">
              <h4>{{ p.title }}</h4>
              <p>£{{ p.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <footer>
      <div v-if="isScrollable && !isAtBottom" id="default_text">Scroll to continue...</div>
      <div v-if="isAtBottom || !isScrollable" id="bottom_text">You have reached the bottom of the page</div>
    </footer>
  </main>
</template>

<style scoped>
/* Header: Search */
.search-form {
  display: flex;
  flex: 1;
  max-width: 30rem;
  flex-direction: column;
  gap: 0.375rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

#textbox1 {
  width: 100%;
  height: 2.75rem;
  background-color: #333333;
  border: 0.125rem solid #565656;
  border-radius: 0.5rem;
  padding: 0 5.75rem 0 0.9375rem;
  color: white;
  font-size: 1rem;
  font-family: inherit;
}

#textbox1:focus {
  background-color: #3a3a3a;
  border-color: #7a7a7a;
  outline: none;
  box-shadow: 0 0 0.625rem rgba(122, 122, 122, 0.3);
}

#textbox1::placeholder {
  color: #999999;
}

#textbox1.search-open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.clear-btn {
  position: absolute;
  right: 3rem;
  background: none;
  border: none;
  color: #777777;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  transition: color 0.2s ease, background-color 0.2s ease;
  z-index: 2;
}

.clear-btn:hover {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
}

.char-count {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #666;
  pointer-events: none;
  opacity: 0.6;
}

/* Header: Search Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% - 0.125rem);
  left: 0;
  right: 0;
  background-color: #2a2a2a;
  border: 0.125rem solid #424242;
  border-top: 0.125rem solid #424242;
  border-radius: 0 0 0.5rem 0.5rem;
  z-index: 100;
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.5);
  margin-top: 0;
  overflow: hidden;
}

.search-dropdown .dropdown-section:first-child .section-title {
  padding-top: 0.5rem;
}

.dropdown-section {
  padding: 0.5rem 0;
  border-bottom: 0.0625rem solid #3a3a3a;
}

.dropdown-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.9375rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  padding: 0.25rem 0.9375rem;
}

.clear-history {
  background: none;
  border: none;
  color: #4db8ff;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.clear-history:hover {
  text-decoration: underline;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.9375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #3a3a3a;
}

.item-thumb {
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  border-radius: 0.25rem;
  background-color: #333;
}

.item-title {
  font-size: 0.875rem;
  color: #eee;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-icon {
  font-size: 0.875rem;
  color: #666;
}

.history-item:hover .history-icon {
  color: #4db8ff;
}

.history-item {
  justify-content: space-between;
}

.history-remove {
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.history-remove:hover {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
}

.history-item .item-title {
  flex: 1;
  min-width: 0;
  margin-right: 0.5rem;
}

/* Header: Actions & Menus */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.9375rem;
}

.sort-select {
  position: relative;
  width: 11.25rem;
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
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  gap: 0.5rem;
}

.trigger-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.actions-wrapper {
  display: flex;
  gap: 0.9375rem;
  align-items: center;
}

.sort-trigger:hover {
  background-color: #3a3a3a;
  border-color: #656565;
}

.sort-trigger:focus {
  outline: none;
  border-color: #7a7a7a;
  box-shadow: 0 0 0.625rem rgba(122, 122, 122, 0.3);
}

.sort-arrow {
  margin-left: 0.5rem;
  color: #999999;
}

.sort-options {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background-color: #2a2a2a;
  border: 0.125rem solid #565656;
  border-radius: 0.75rem;
  box-shadow: 0 0.875rem 1.75rem rgba(0, 0, 0, 0.35);
  overflow: hidden;
  z-index: 20;
}

.sort-option {
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.sort-option.selected {
  background-color: #3a3a3a;
}

@media (hover: hover) {
  .sort-options:hover .sort-option.selected:not(:hover) {
    background-color: transparent;
  }

  .sort-option:hover {
    background-color: #3a3a3a;
  }
}

.recent-searches {
  max-width: 87.5rem;
  margin: 0.9375rem auto 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9375rem;
  flex-wrap: wrap;
  background-color: rgba(0, 0, 0, 0.25);
  border: 0.0625rem solid #333;
  border-radius: 0.75rem;
}

.recent-searches .search-tags {
  flex: 1;
  justify-content: flex-start;
}

.recent-label {
  color: #999999;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
  white-space: nowrap;
  margin-right: 0.3125rem;
}

.search-tags {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.search-tag {
  display: flex;
  align-items: center;
  background-color: #333333;
  border: 0.0625rem solid #565656;
  border-radius: 1.25rem;
  height: 2rem;
  padding: 0 0.75rem;
  transition: all 0.2s ease;
}

.search-tag:hover {
  background-color: #3a3a3a;
  border-color: #4db8ff;
}

.tag-text {
  background: none;
  border: none;
  color: white;
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin: 0 0.5rem 0 0;
  font-weight: 500;
  transition: color 0.2s ease;
}

.tag-text:hover {
  color: #4db8ff;
}

.tag-remove {
  background: none;
  border: none;
  color: #999999;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.tag-remove:hover {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
}

.category-filters {
  max-width: 87.5rem;
  margin: 1.25rem auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  padding: 0.25rem 0.125rem 0.75rem;
}

.category-pill {
  padding: 0.5rem 1.25rem;
  background-color: #2a2a2a;
  border: 0.125rem solid #424242;
  border-radius: 1.25rem;
  color: #999;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.category-pill:hover {
  border-color: #666;
  color: white;
}

.category-pill.active {
  background-color: #4db8ff;
  border-color: #4db8ff;
  color: white;
  box-shadow: 0 0.25rem 0.75rem rgba(77, 184, 255, 0.3);
}

@media (max-width: 48rem) {
  header {
    padding: 0.875rem 1rem 0.5rem;
  }

  .category-filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 0.5rem;
    padding: 0.125rem 0.25rem 0.25rem;
    margin-top: 0.5rem;
  }

  .category-filters::-webkit-scrollbar {
    display: none;
  }

  .category-pill {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    border-width: 0.09375rem;
  }
}

/* Filter Panel Styles */
.filter-panel {
  max-width: 87.5rem;
  margin: 1rem auto 0;
  background-color: #2a2a2a;
  border: 0.125rem solid #424242;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 2rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.3);
}

.filter-section h3 {
  font-size: 1rem;
  color: #4db8ff;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
}

.price-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.price-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.price-field span {
  font-size: 0.75rem;
  color: #999;
}

.price-field input {
  background-color: #333;
  border: 0.0625rem solid #565656;
  border-radius: 0.375rem;
  padding: 0.5rem;
  color: white;
  font-family: inherit;
}

.price-slider {
  width: 100%;
  accent-color: #4db8ff;
}

.brand-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 10rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.brand-chip {
  padding: 0.375rem 0.75rem;
  background-color: #333;
  border: 0.0625rem solid #565656;
  border-radius: 1rem;
  color: #ccc;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.brand-chip:hover {
  border-color: #999;
  color: white;
}

.brand-chip.active {
  background-color: rgba(77, 184, 255, 0.2);
  border-color: #4db8ff;
  color: #4db8ff;
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  border-top: 0.0625rem solid #3a3a3a;
  padding-top: 1rem;
}

.clear-filters-btn {
  background: none;
  border: 0.0625rem solid #ff6b6b;
  color: #ff6b6b;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background-color: rgba(255, 107, 107, 0.1);
}

.compare-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.empty-subtitle {
  color: #666;
  font-size: 0.875rem;
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
}

.compare-empty .empty-illustration {
  width: 8rem;
  height: 8rem;
  margin-bottom: 1rem;
}

.compare-empty .empty-icon {
  font-size: 4rem;
}

.browse-button {
  background: #4db8ff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.browse-button:hover {
  background: #3a9dd8;
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease-out;
  max-height: 31.25rem;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.compare-toggle-btn {
  position: absolute;
  top: calc(0.625rem + 3.25rem);
  right: 0.625rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(0.25rem);
}

.compare-toggle-btn.active {
  background-color: #4db8ff;
  color: white;
}

.share-card-btn {
  position: absolute;
  top: calc(0.625rem + 6.5rem);
  right: 0.625rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(0.25rem);
}

.share-card-btn:hover {
  background-color: #4db8ff;
}

/* Compare Modal */
.compare-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.25rem;
  backdrop-filter: blur(0.5rem);
}

.compare-modal {
  background-color: #1a1a1a;
  width: 100%;
  max-width: 62.5rem;
  max-height: 90vh;
  border-radius: 1rem;
  border: 0.125rem solid #424242;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.compare-header {
  padding: 1.5rem;
  border-bottom: 0.0625rem solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #4db8ff;
}

.close-modal {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
}

.compare-table-wrapper {
  overflow-x: auto;
  padding: 1.5rem;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
}

.compare-table th, .compare-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 0.0625rem solid #333;
  color: #eee;
}

.compare-table th {
  color: #666;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.compare-item-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.compare-thumb {
  width: 5rem;
  height: 5rem;
  object-fit: cover;
  border-radius: 0.5rem;
  background-color: #333;
}

.compare-item-header p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
}

.remove-compare {
  background: none;
  border: 0.0625rem solid #ff6b6b;
  color: #ff6b6b;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.compare-price {
  color: #4db8ff;
  font-weight: 700;
  font-size: 1.125rem;
}

.capitalize {
  text-transform: capitalize;
}

@media (max-width: 48rem) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-content h1 {
    display: none;
  }

  .header-right {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas: 
      "search search search"
      "sort paginate actions";
    gap: 0.75rem 0.5rem;
    width: 100%;
  }

  .search-form {
    grid-area: search;
    max-width: 100%;
    width: 100%;
  }
  
  #textbox1 {
    padding-right: 6.5rem;
  }
  
  .sort-select { 
    grid-area: sort; 
    width: 100%;
  }
  
  .pagination-select { 
    grid-area: paginate; 
    width: 100%;
  }
  
  .actions-wrapper {
    grid-area: actions;
    display: flex;
    gap: 0.375rem;
    width: 100%;
  }

  .sort-select, .pagination-select {
    max-width: none;
  }

  .header-btn {
    flex: 1;
    min-width: 0;
    width: auto;
    height: 2.75rem;
  }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  gap: 1.875rem;
  padding: 0 1rem;
}

.products-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  gap: 1.875rem;
  grid-column: 1 / -1;
}

@media (max-width: 48rem) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.875rem;
    padding: 0 0.75rem;
  }

  .products-grid-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.875rem;
  }

  .product-info {
    padding: 0.875rem;
  }

  .price-container {
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .product-price {
    font-size: 1.05rem;
    white-space: nowrap;
  }

  .original-price {
    font-size: 0.75rem;
    white-space: nowrap;
  }


  .product-description {
    display: block;
    line-height: 1.5;
    overflow: hidden;
    max-height: calc(1.5em * 3);
    height: auto;
    margin-bottom: 0.5rem;
  }

  .product-meta {
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
}

/* Rating Filter Styles */
.rating-filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rating-chip {
  padding: 0.375rem 0.75rem;
  background-color: #333;
  border: 0.0625rem solid #565656;
  border-radius: 1rem;
  color: #ccc;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.rating-chip:hover {
  border-color: #999;
  color: white;
}

.rating-chip.active {
  background-color: rgba(77, 184, 255, 0.2);
  border-color: #4db8ff;
  color: #4db8ff;
}

.product-image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background-color: #333;
  border-radius: 0.75rem 0.75rem 0 0;
}

.product-badges {
  position: absolute;
  top: 0.625rem;
  left: 0.625rem;
  right: 0.625rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  z-index: 5;
  pointer-events: none;
}

.badge-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.stock-tag {
  background-color: #ff9800;
  color: white;
}

.out-of-stock-tag {
  background-color: #757575;
  color: white;
}

.discount-tag {
  background-color: #ff6b6b;
  color: white;
}

.best-seller-tag {
  background-color: #4db8ff;
  color: white;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.price-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  align-items: baseline;
  flex-wrap: nowrap;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
}

.product-price {
  margin: 0;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.original-price {
  margin: 0;
  color: #777;
  text-decoration: line-through;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background-color: #333;
  border: 0.0625rem solid #424242;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #eee;
  line-height: 1;
}

.product-rating {
  color: #ffc107;
}

.product-stock {
  color: #b3b3b3;
}

.product-stock.low-stock {
  border-color: rgba(255, 152, 0, 0.6);
  color: #ff9800;
}

.product-rating,
.product-stock {
  font-variant-numeric: tabular-nums;
}

/* Persistent Compare Bar Styles */
.compare-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 50rem;
  background-color: #2a2a2a;
  border: 0.125rem solid #4db8ff;
  border-radius: 1rem;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.5);
  padding: 0.75rem 1.25rem;
  backdrop-filter: blur(0.625rem);
}

.compare-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.compare-bar-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.compare-bar-icon {
  font-size: 1.25rem;
}

.compare-bar-text {
  font-size: 0.875rem;
  color: #eee;
}

.compare-bar-thumbs {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  overflow-x: auto;
  padding: 0.25rem 0;
}

.compare-bar-thumb-wrapper {
  position: relative;
  flex-shrink: 0;
}

.compare-bar-thumb {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 0.0625rem solid #444;
}

.compare-bar-remove {
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  width: 1rem;
  height: 1rem;
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 0.625rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3);
}

.compare-bar-actions {
  display: flex;
  gap: 0.75rem;
}

.compare-bar-clear {
  background: none;
  border: 0.0625rem solid #555;
  color: #999;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.compare-bar-view {
  background-color: #4db8ff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

/* Compare Bar Animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}

@media (max-width: 48rem) {
  .compare-bar {
    bottom: 5.5rem; /* Above mobile navigation if any */
    padding: 0.5rem 0.75rem;
  }
  
  .compare-bar-text {
    display: none; /* Hide text on small mobile to save space */
  }
  
  .compare-bar-content {
    gap: 0.75rem;
  }
}

/* No Results Styles */
.no-results {
  grid-column: 1 / -1;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  text-align: center;
}

.no-results-content {
  max-width: 30rem;
}

.no-results-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.no-results h2 {
  font-size: 1.75rem;
  color: white;
  margin-bottom: 1rem;
}

.no-results p {
  color: #999;
  margin-bottom: 2rem;
}

.clear-search-btn {
  background: #4db8ff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-search-btn:hover {
  background: #3a9dd8;
}

.clear-search-btn.secondary {
  background: #333;
  border: 0.0625rem solid #444;
}

.clear-search-btn.secondary:hover {
  background: #444;
}

.no-results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.smart-suggestions {
  width: 100%;
  max-width: 60rem;
  background-color: #2a2a2a;
  padding: 2rem;
  border-radius: 1rem;
  border: 0.0625rem solid #424242;
}

.smart-suggestions h3 {
  font-size: 1.125rem;
  color: #4db8ff;
  margin-bottom: 1.5rem;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1.5rem;
}

.suggestion-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-decoration: none;
  background-color: #333;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: transform 0.2s;
}

.suggestion-card:hover {
  transform: translateY(-0.25rem);
}

.suggestion-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.375rem;
}

.suggestion-info h4 {
  font-size: 0.875rem;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-info p {
  color: #4db8ff;
  font-weight: 700;
  font-size: 0.875rem;
  margin: 0.25rem 0 0;
}

/* Recently Viewed Styles */
.recently-viewed-section {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 0.0625rem solid #333;
}

.recently-viewed-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.recently-viewed-section h3 {
  font-size: 1.25rem;
  color: white;
  margin: 0;
}

.viewed-count {
  font-size: 0.875rem;
  color: #666;
}

.viewed-scroll-container {
  overflow-x: auto;
  padding: 0.5rem 1rem 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: #444 transparent;
}

.viewed-scroll-container::-webkit-scrollbar {
  height: 0.375rem;
}

.viewed-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.viewed-scroll-container::-webkit-scrollbar-thumb {
  background-color: #444;
  border-radius: 0.625rem;
}

.viewed-row {
  display: flex;
  gap: 1.5rem;
  width: max-content;
}

.viewed-card {
  width: 10rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-decoration: none;
  transition: transform 0.2s;
}

.viewed-card:hover {
  transform: translateY(-0.3125rem);
}

.viewed-thumb-wrapper {
  width: 10rem;
  height: 10rem;
  background-color: #2a2a2a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 0.0625rem solid #333;
}

.viewed-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.viewed-info h4 {
  font-size: 0.8125rem;
  color: #eee;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.viewed-info p {
  color: #4db8ff;
  font-weight: 700;
  font-size: 0.875rem;
  margin: 0.25rem 0 0;
}
</style>