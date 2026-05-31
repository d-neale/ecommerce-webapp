<template>
  <div class="skeleton-card">
    <div class="skeleton-image shimmer"></div>
    <div class="skeleton-info">
      <div class="skeleton-title shimmer"></div>
      <div class="skeleton-price shimmer"></div>
      <div class="skeleton-text shimmer"></div>
      <div class="skeleton-meta shimmer"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  height: 100%;
  background-color: #2a2a2a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 0.125rem solid #333;
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 1;
  background-color: #333;
}

.skeleton-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-title {
  height: 1.25rem;
  width: 80%;
  background-color: #333;
  border-radius: 0.25rem;
}

.skeleton-price {
  height: 1.5rem;
  width: 40%;
  background-color: #333;
  border-radius: 0.25rem;
}

.skeleton-text {
  height: 3rem;
  width: 100%;
  background-color: #333;
  border-radius: 0.25rem;
}

.skeleton-meta {
  height: 1rem;
  width: 60%;
  background-color: #333;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.05) 20%,
    rgba(255, 255, 255, 0.1) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 2s infinite;
  content: '';
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
