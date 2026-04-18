<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import roomService from '../../services/roomService'
import bookingService from '../../services/bookingService'

const route = useRoute()
const room = ref(null)
const availability = ref(null)
const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const loading = ref(false)

const bookingModal = ref(false)
const selectedSlot = ref(null)
const bookingPurpose = ref('')
const bookingLoading = ref(false)
const bookingError = ref(null)
const purposeError = ref(null)

const isPastDate = computed(() => selectedDate.value < today)

async function fetchRoom() {
  try {
    const res = await roomService.show(route.params.id)
    room.value = res.data
  } catch (err) {
    console.error(err)
  }
}

async function fetchAvailability() {
  loading.value = true
  try {
    const res = await roomService.availability(route.params.id, selectedDate.value)
    availability.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function openBooking(slot) {
  selectedSlot.value = slot
  bookingPurpose.value = ''
  bookingError.value = null
  purposeError.value = null
  bookingModal.value = true
}

async function confirmBooking() {
  purposeError.value = null
  bookingError.value = null

  if (!bookingPurpose.value.trim()) {
    purposeError.value = 'Informe o motivo da reserva.'
    return
  }

  bookingLoading.value = true
  try {
    const startTime = `${selectedDate.value}T${selectedSlot.value.start}`
    const endTime = `${selectedDate.value}T${selectedSlot.value.end}`

    await bookingService.store({
      roomId: route.params.id,
      startTime,
      endTime,
      purpose: bookingPurpose.value
    })

    bookingModal.value = false
    fetchAvailability()
  } catch (err) {
    const data = err.response?.data
    if (data?.startTime) {
      bookingError.value = `Horário inválido: ${data.startTime}`
    } else {
      bookingError.value = data?.message || 'Não foi possível realizar a reserva. Tente novamente.'
    }
  } finally {
    bookingLoading.value = false
  }
}

onMounted(() => {
  fetchRoom()
  fetchAvailability()
})

watch(selectedDate, fetchAvailability)
</script>

<template>
  <div v-if="room">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1">{{ room.name }}</h4>
        <p class="text-muted mb-0 small">
          <i class="bi bi-geo-alt me-1"></i>{{ room.location }} |
          <i class="bi bi-people me-1"></i>Capacidade: {{ room.capacity }}
        </p>
      </div>
      <div class="d-flex align-items-center">
        <label class="me-2 small fw-bold text-muted">DATA:</label>
        <input v-model="selectedDate" type="date" :min="today" class="form-control form-control-sm">
      </div>
    </div>

    <div v-if="isPastDate" class="alert alert-warning d-flex align-items-center">
      <i class="bi bi-calendar-x me-2"></i>
      Não é possível reservar para datas passadas. Selecione hoje ou uma data futura.
    </div>

    <div v-else-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="availability" class="row g-3">
      <div v-for="slot in availability.slots" :key="slot.start" class="col-6 col-md-4 col-lg-2">
        <div
          class="card h-100 text-center border-0 shadow-sm transition-hover"
          :class="slot.available ? 'bg-white' : 'bg-danger-subtle opacity-75'"
        >
          <div class="card-body py-3">
            <h6 class="fw-bold mb-1">{{ slot.start.substring(0, 5) }} – {{ slot.end.substring(0, 5) }}</h6>
            <div v-if="slot.available">
              <span class="badge bg-success mb-2">Livre</span>
              <button @click="openBooking(slot)" class="btn btn-sm btn-primary d-block w-100">Reservar</button>
            </div>
            <div v-else>
              <span class="badge bg-danger mb-1">Ocupado</span>
              <small class="d-block text-truncate mt-1 fw-bold" :title="slot.bookedBy">{{ slot.bookedBy }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Modal -->
    <div v-if="bookingModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold">Confirmar Reserva</h5>
            <button @click="bookingModal = false" type="button" class="btn-close btn-close-white"></button>
          </div>
          <div class="modal-body">
            <div class="p-3 bg-light rounded mb-3 small">
              <p class="mb-1"><strong>Sala:</strong> {{ room.name }}</p>
              <p class="mb-1"><strong>Data:</strong> {{ new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR') }}</p>
              <p class="mb-0"><strong>Horário:</strong> {{ selectedSlot.start.substring(0, 5) }} às {{ selectedSlot.end.substring(0, 5) }}</p>
            </div>

            <div v-if="bookingError" class="alert alert-danger py-2 small">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ bookingError }}
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold">Motivo da Reunião</label>
              <textarea
                v-model="bookingPurpose"
                class="form-control"
                :class="{ 'is-invalid': purposeError }"
                rows="3"
                placeholder="Ex: Daily Scrum, Alinhamento de Projeto..."
              ></textarea>
              <div v-if="purposeError" class="invalid-feedback">{{ purposeError }}</div>
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button @click="bookingModal = false" type="button" class="btn btn-secondary" :disabled="bookingLoading">Cancelar</button>
            <button @click="confirmBooking" type="button" class="btn btn-primary" :disabled="bookingLoading">
              <span v-if="bookingLoading" class="spinner-border spinner-border-sm me-1"></span>
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transition-hover {
  transition: transform 0.2s;
}
.transition-hover:hover {
  transform: translateY(-3px);
}
</style>