<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="d-flex min-vh-100">
    <!-- Sidebar -->
    <div class="bg-dark text-white p-3 shadow" style="width: 260px;">
      <h5 class="mb-4 text-center py-2 border-bottom">
        <i class="bi bi-building me-2"></i>Room Booking
      </h5>
      
      <div class="nav flex-column nav-pills">
        <RouterLink :to="{ name: 'rooms' }" class="nav-link text-white mb-2" active-class="active bg-primary">
          <i class="bi bi-grid-3x3-gap me-2"></i>Salas
        </RouterLink>
        <RouterLink :to="{ name: 'bookings' }" class="nav-link text-white mb-2" active-class="active bg-primary">
          <i class="bi bi-calendar-check me-2"></i>Minhas Reservas
        </RouterLink>
      </div>

      <div v-if="auth.isAdmin" class="mt-4 pt-3 border-top opacity-75">
        <small class="text-uppercase fw-bold d-block mb-2 px-2">Administração</small>
        <span class="badge bg-warning text-dark w-100 py-2">
          <i class="bi bi-shield-lock me-1"></i>Modo Administrador
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-grow-1 bg-light d-flex flex-column">
      <!-- Header -->
      <header class="bg-white shadow-sm p-3 d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-muted">Dashboard</h6>
        
        <div class="d-flex align-items-center">
          <div class="me-3 text-end">
            <div class="fw-bold small">{{ auth.user?.fullName }}</div>
            <span class="badge bg-info text-dark" style="font-size: 0.7rem;">{{ auth.user?.role }}</span>
          </div>
          <button @click="handleLogout" class="btn btn-outline-danger btn-sm">
            <i class="bi bi-box-arrow-right me-1"></i>Sair
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 flex-grow-1 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
