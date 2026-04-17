<script setup>
import { ref, onMounted, reactive } from 'vue'
import roomService from '../../services/roomService'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const rooms = ref([])
const loading = ref(false)
const modalActive = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '',
  capacity: 1,
  location: '',
  hasProjector: false,
  hasWhiteboard: false,
  hasAirConditioning: false
})

async function fetchRooms() {
  loading.ref = true
  try {
    const res = await roomService.index()
    rooms.value = res.data
  } catch (err) {
    console.error('Erro ao buscar salas:', err)
  } finally {
    loading.value = false
  }
}

function openModal(room = null) {
  if (room) {
    editingId.value = room.id
    form.name = room.name
    form.capacity = room.capacity
    form.location = room.location
    form.hasProjector = room.hasProjector
    form.hasWhiteboard = room.hasWhiteboard
    form.hasAirConditioning = room.hasAirConditioning
  } else {
    editingId.value = null
    form.name = ''
    form.capacity = 1
    form.location = ''
    form.hasProjector = false
    form.hasWhiteboard = false
    form.hasAirConditioning = false
  }
  modalActive.value = true
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await roomService.update(editingId.value, form)
    } else {
      await roomService.store(form)
    }
    modalActive.value = false
    fetchRooms()
  } catch (err) {
    alert('Erro ao salvar sala.')
  }
}

async function deleteRoom(id) {
  if (!confirm('Tem certeza que deseja excluir esta sala?')) return
  try {
    await roomService.destroy(id)
    fetchRooms()
  } catch (err) {
    alert('Erro ao excluir sala.')
  }
}

onMounted(fetchRooms)
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0">Salas de Reunião</h4>
      <button v-if="auth.isAdmin" @click="openModal()" class="btn btn-primary">
        <i class="bi bi-plus-lg me-1"></i>Nova Sala
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="row g-4">
      <div v-for="room in rooms" :key="room.id" class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title fw-bold mb-0">{{ room.name }}</h5>
              <span class="badge" :class="room.status === 'AVAILABLE' ? 'bg-success' : 'bg-warning text-dark'">
                {{ room.status === 'AVAILABLE' ? 'Disponível' : 'Manutenção' }}
              </span>
            </div>
            
            <p class="text-muted small mb-3">
              <i class="bi bi-geo-alt me-1"></i>{{ room.location }}
            </p>

            <div class="d-flex gap-3 mb-4">
              <div class="text-center">
                <i class="bi bi-people d-block h5 mb-1 text-primary"></i>
                <small class="text-muted">{{ room.capacity }}</small>
              </div>
              <div v-if="room.hasProjector" class="text-center" title="Projetor">
                <i class="bi bi-projector d-block h5 mb-1 text-secondary"></i>
              </div>
              <div v-if="room.hasWhiteboard" class="text-center" title="Quadro Branco">
                <i class="bi bi-easel d-block h5 mb-1 text-secondary"></i>
              </div>
              <div v-if="room.hasAirConditioning" class="text-center" title="Ar-condicionado">
                <i class="bi bi-wind d-block h5 mb-1 text-secondary"></i>
              </div>
            </div>

            <div class="d-grid gap-2">
              <RouterLink :to="{ name: 'rooms.availability', params: { id: room.id } }" class="btn btn-outline-primary btn-sm">
                <i class="bi bi-calendar-check me-1"></i>Ver Disponibilidade
              </RouterLink>
              
              <div v-if="auth.isAdmin" class="btn-group w-100 mt-1">
                <button @click="openModal(room)" class="btn btn-light btn-sm border">
                  <i class="bi bi-pencil me-1"></i>Editar
                </button>
                <button @click="deleteRoom(room.id)" class="btn btn-light btn-sm border text-danger">
                  <i class="bi bi-trash me-1"></i>Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal CRUD (Simples) -->
    <div v-if="modalActive" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold">{{ editingId ? 'Editar Sala' : 'Nova Sala' }}</h5>
            <button @click="modalActive = false" type="button" class="btn-close btn-close-white"></button>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small fw-bold">Nome da Sala</label>
                <input v-model="form.name" type="text" class="form-control" required>
              </div>
              <div class="row">
                <div class="col-6 mb-3">
                  <label class="form-label small fw-bold">Capacidade</label>
                  <input v-model.number="form.capacity" type="number" class="form-control" min="1" required>
                </div>
                <div class="col-6 mb-3">
                  <label class="form-label small fw-bold">Localização</label>
                  <input v-model="form.location" type="text" class="form-control" placeholder="Ex: 1º Andar" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold d-block mb-2">Recursos Disponíveis</label>
                <div class="form-check form-check-inline">
                  <input v-model="form.hasProjector" class="form-check-input" type="checkbox" id="proj">
                  <label class="form-check-label" for="proj">Projetor</label>
                </div>
                <div class="form-check form-check-inline">
                  <input v-model="form.hasWhiteboard" class="form-check-input" type="checkbox" id="quadro">
                  <label class="form-check-label" for="quadro">Quadro Branco</label>
                </div>
                <div class="form-check form-check-inline">
                  <input v-model="form.hasAirConditioning" class="form-check-input" type="checkbox" id="ar">
                  <label class="form-check-label" for="ar">Ar-condicionado</label>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button @click="modalActive = false" type="button" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
