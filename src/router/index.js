import { createRouter, createWebHashHistory } from 'vue-router'
import Products from '../views/Products.vue'
import ProductDetails from '../views/ProductDetails.vue'
import Wishlist from '../views/Wishlist.vue'
import Cart from '../views/Cart.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'products',
      component: Products,
      meta: { title: 'Products' },
    },
    {
      path: '/product/:id',
      name: 'product details',
      component: ProductDetails,
      meta: { title: 'Product Details' },
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: Wishlist,
      meta: { title: 'Wishlist' },
    },
    {
      path: '/cart',
      name: 'cart',
      component: Cart,
      meta: { title: 'Cart' },
    }
  ],
})

router.afterEach((to) => {
  const baseTitle = 'Ecommerce Webapp'
  const pageTitle = to.meta && to.meta.title ? String(to.meta.title) : ''
  document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle
})

export default router
