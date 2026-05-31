# 🛒 E‑commerce Webapp



A **responsive**, **interactive** e‑commerce front‑end built with **Vue 3**.

Browse products, search and filter, compare items, manage a wishlist, and add items to a basket — all UI‑focused, with no real checkout or payment integration.



**Live site**:



---



## ✨ Features

* 🛍️ **Product browsing grid** with skeleton loading states

* 🔍 **Search experience**
  * Suggestions while typing
  * Recent searches dropdown (with per‑item removal + clear‑all)
  * Persistent last search text

* ↕️ **Sorting and pagination** (persisted)

* 🎛️ **Advanced filters** (category, brand, price range, minimum rating)

* 📄 **Product details page**
  * Image gallery + lightbox
  * Review sorting/filtering with custom dropdowns
  * “You may also like” recommendations

* ❤️ **Wishlist (favorites)** with persistence

* 🛒 **Basket/cart** with quantity controls + order summary

* 🧩 **Mini‑cart sidebar** with global toast notifications

* 📊 **Compare list** (up to 3 products) with persistence

* 🕒 **Recently viewed products** with persistence

* 🔗 **Share/copy link support** (Web Share API + clipboard fallback)

* 📱 **Responsive, touch‑friendly UI** with reduced‑motion support

* ⌨️ **Keyboard escape‑to‑close** for overlays and menus



---



## 🛠️ Technologies Used



- **Vue 3**

- **Vite**

- **Vue Router**

- **Pinia** (global store)

- **CSS** (responsive layouts, transitions/animations)

- **Browser APIs**: `localStorage`, Web Share API, Clipboard API

- **DummyJSON API** (`https://dummyjson.com/products`)



---



## 🎯 Purpose of the Project



Created as part of my learning journey as a Computer Science student, focusing on:



* **Component‑based UI architecture**

* **State management** with Pinia

* **Routing and navigation patterns**

* **Search, filtering, and sorting UX**

* **Responsive design and accessibility**

* **Integrating browser APIs**

* **Building scalable front‑end structures**



---



## 🚀 Running the Project



1. Install dependencies:
npm install

2. Run the development server:
npm run dev

3. Build for production:
npm run build

4. Preview the production build locally:
npm run preview



Or deploy the generated `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.).

### GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys the `dist/` output to GitHub Pages.

1. Push to `main`
2. In GitHub: Settings → Pages → Source: **GitHub Actions**



---



## 📌 Requirements



- A modern browser (Chrome, Firefox, Edge, Safari)

- JavaScript enabled

- Internet connection for fetching product data (DummyJSON API)



---



## 📄 License



This project is released under the **Apache License 2.0**.

You may use, modify, and distribute the code, provided that:

* Attribution is given to the original author  
* The Apache License 2.0 text is included in any copies or substantial portions of the project  
* Any modifications include a clear notice of changes  



**Note: External libraries and APIs (e.g., Vue, Vite, DummyJSON) remain under their own respective licenses.**



---



## 👤 Author



**Daniel Neale**
