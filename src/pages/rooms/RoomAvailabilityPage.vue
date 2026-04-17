<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import roomService from '../../services/roomService'
import bookingService from '../../services/bookingService'

const route = useRoute()
const room = ref(null)
const availability = ref(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)

const bookingModal = ref(false)
const selectedSlot = ref(null)
const bookingPurpose = ref('')
const bookingLoading = ref(false)

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
  bookingModal.value = true
}

async function confirmBooking() {
  if (!bookingPurpose.value) return alert('Informe o motivo da reserva.')
  
  bookingLoading.value = true
  try {
    const startTime = `${selectedDate.value}T${selectedSlot.value.time}:00`
    // Default duration: 1 hour
    const [h, m] = selectedSlot.value.time.split(':')
    const endH = String(Number(h) + 1).padStart(2, '0')
    const endTime = `${selectedDate.value}T${endH}:${m}:00`

    await bookingService.store({
      roomId: route.params.id,
      startTime,
      endTime,
      purpose: bookingPurpose.value
    })
    
    bookingModal.value = false
    fetchAvailability()
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao realizar reserva.')
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
        <input v-model="selectedDate" type="date" class="form-control form-control-sm">
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="availability" class="row g-3">
      <div v-for="slot in availability.slots" :key="slot.time" class="col-6 col-md-4 col-lg-2">
        <div 
          class="card h-100 text-center border-0 shadow-sm transition-hover"
          :class="slot.available ? 'bg-white' : 'bg-danger-subtle opacity-75'"
        >
          <div class="card-body py-3">
            <h6 class="fw-bold mb-1">{{ slot.time }}</h6>
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
              <p class="mb-1"><strong>Data:</strong> {{ new Date(selectedDate).toLocaleDateString() }}</p>
              <p class="mb-0"><strong>Horário:</strong> {{ selectedSlot.time }} às {{ String(Number(selectedSlot.time.split(':')[0]) + 1).padStart(2, '0') }}:{{ selectedSlot.time.split(':')[1] }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Motivo da Reunião</label>
              <textarea v-model="bookingPurpose" class="form-control" rows="3" placeholder="Ex: Daily Scrum, Alinhamento de Projeto..."></textarea>
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
