<script setup>
import { ref, onMounted } from 'vue'
import bookingService from '../../services/bookingService'

const bookings = ref([])
const loading = ref(false)
const cancelError = ref(null)

async function fetchBookings() {
  loading.value = true
  try {
    const res = await bookingService.myBookings()
    bookings.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function cancelBooking(id) {
  cancelError.value = null
  try {
    await bookingService.cancel(id)
    fetchBookings()
  } catch (err) {
    const status = err.response?.status
    if (status === 400) {
      cancelError.value = 'Esta reserva não pode ser cancelada com menos de 2 horas de antecedência.'
    } else if (status === 403) {
      cancelError.value = 'Você não tem permissão para cancelar esta reserva.'
    } else {
      cancelError.value = 'Não foi possível cancelar a reserva. Tente novamente.'
    }
  }
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'CONFIRMED': return 'bg-success'
    case 'CANCELLED': return 'bg-danger'
    case 'COMPLETED': return 'bg-info text-dark'
    default: return 'bg-secondary'
  }
}

onMounted(fetchBookings)
</script>

<template>
  <div>
    <h4 class="fw-bold mb-4">Minhas Reservas</h4>

    <div v-if="cancelError" class="alert alert-warning d-flex align-items-center mb-4">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ cancelError }}
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="bookings.length === 0" class="card shadow-sm border-0 py-5 text-center">
      <div class="card-body">
        <i class="bi bi-calendar-x h1 text-muted d-block mb-3"></i>
        <h5 class="text-muted">Você ainda não possui reservas.</h5>
        <RouterLink :to="{ name: 'rooms' }" class="btn btn-primary mt-3">Ver Salas Disponíveis</RouterLink>
      </div>
    </div>

    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th class="px-4 py-3 border-0 small text-uppercase fw-bold">Sala</th>
              <th class="py-3 border-0 small text-uppercase fw-bold">Início</th>
              <th class="py-3 border-0 small text-uppercase fw-bold">Fim</th>
              <th class="py-3 border-0 small text-uppercase fw-bold">Motivo</th>
              <th class="py-3 border-0 small text-uppercase fw-bold">Status</th>
              <th class="px-4 py-3 border-0 small text-uppercase fw-bold text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in bookings" :key="booking.id">
              <td class="px-4 py-3">
                <div class="fw-bold">{{ booking.roomName }}</div>
                <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>{{ booking.roomLocation }}</small>
              </td>
              <td class="py-3 small text-muted">{{ formatDateTime(booking.startTime) }}</td>
              <td class="py-3 small text-muted">{{ formatDateTime(booking.endTime) }}</td>
              <td class="py-3 small">{{ booking.purpose }}</td>
              <td class="py-3">
                <span class="badge" :class="getStatusBadgeClass(booking.status)">
                  {{ booking.status === 'CONFIRMED' ? 'Confirmada' : (booking.status === 'CANCELLED' ? 'Cancelada' : 'Concluída') }}
                </span>
              </td>
              <td class="px-4 py-3 text-end">
                <button 
                  v-if="booking.status === 'CONFIRMED'"
                  @click="cancelBooking(booking.id)" 
                  class="btn btn-sm btn-outline-danger border-0"
                  title="Cancelar Reserva"
                >
                  <i class="bi bi-trash me-1"></i>Cancelar
                </button>
                <span v-else class="text-muted small italic">Nenhuma ação</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
  background-color: rgba(0,0,0,0.02);
}
</style>
