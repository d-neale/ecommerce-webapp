<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  isFavorited: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['favorite', 'addToCart', 'close'])

const menuRef = ref(null)
const position = ref({ x: 0, y: 0 })
const visible = ref(false)

const pxToRem = (px) => {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return `${px / rootFontSize}rem`
}

const menuStyle = computed(() => ({
  top: pxToRem(position.value.y),
  left: pxToRem(position.value.x),
}))

const open = (e) => {
  e.preventDefault()
  position.value = { x: e.clientX, y: e.clientY }
  visible.value = true
  
  // Adjust position if menu goes off screen
  setTimeout(() => {
    if (menuRef.value) {
      const menuWidth = menuRef.value.offsetWidth
      const menuHeight = menuRef.value.offsetHeight
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const edgeGap = 0.625 * rootFontSize

      if (position.value.x + menuWidth > windowWidth) {
        position.value.x = windowWidth - menuWidth - edgeGap
      }
      if (position.value.y + menuHeight > windowHeight) {
        position.value.y = windowHeight - menuHeight - edgeGap
      }
    }
  }, 0)
}

const close = () => {
  visible.value = false
  emit('close')
}

const handleFavorite = () => {
  emit('favorite', props.product.id)
  close()
}

const handleAddToCart = () => {
  emit('addToCart', props.product)
  close()
}

const handleDocumentClick = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('contextmenu', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('contextmenu', handleDocumentClick)
})

defineExpose({ open, close })
</script>

<template>
  <div 
    v-if="visible" 
    ref="menuRef"
    class="context-menu"
    :style="menuStyle"
    role="menu"
  >
    <button type="button" @click="handleFavorite" class="menu-item" role="menuitem">
      <span class="icon">{{ isFavorited ? '💔' : '♥' }}</span>
      {{ isFavorited ? 'Remove from Favorites' : 'Add to Favorites' }}
    </button>
    <button type="button" @click="handleAddToCart" class="menu-item" role="menuitem">
      <span class="icon">🛒</span>
      Add to Cart
    </button>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background-color: #2a2a2a;
  border: 0.125rem solid #424242;
  border-radius: 0.75rem;
  padding: 0.5rem;
  z-index: 10000;
  min-width: 12.5rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  backdrop-filter: blur(0.5rem);
  animation: menuAppear 0.2s ease-out;
}

@keyframes menuAppear {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #eee;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.menu-item:hover {
  background-color: #3a3a3a;
  color: #4db8ff;
}

.icon {
  font-size: 1.1rem;
  width: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>