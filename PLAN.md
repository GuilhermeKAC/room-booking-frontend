# Plano de Implementação — Room Booking Frontend

## Contexto

Frontend Vue 3 para o sistema de reserva de salas.  
A API Spring Boot já está pronta e rodando em `http://localhost:8080`.  
O Vite está configurado com proxy: requisições para `/api/*` são redirecionadas para `http://localhost:8080/api/*` — isso elimina problemas de CORS.

**Para rodar o projeto:**
```bash
cd /var/www/room-booking-frontend
npm run dev
```
Acesse em `http://localhost:5173`.

---

## Stack
``
- Vue 3 (script setup + Composition API)
- Vue Router 4
- Pinia (state management)``
- Axios (HTTP client)
- Bootstrap 5 + Bootstrap Icons

---

## Estrutura de pastas (já criada)

```
src/
├── components/ui/       # Componentes reutilizáveis
├── layouts/             # AppLayout.vue, AuthLayout.vue
├── pages/
│   ├── auth/            # LoginPage.vue
│   ├── rooms/           # RoomsPage.vue, RoomAvailabilityPage.vue
│   └── bookings/        # BookingsPage.vue
├── router/              # index.js
├── services/            # http.js, authService.js, roomService.js, bookingService.js
├── stores/              # auth.js
├── App.vue
└── main.js
```

---

## Endpoints da API disponíveis

### Auth
- `POST /api/auth/register` — `{ username, email, fullName, password }`
- `POST /api/auth/login` — `{ username, password }` → `{ token }`
- `GET /api/auth/me` → `{ id, username, email, fullName, role }`

### Rooms
- `GET /api/rooms` → array de salas
- `GET /api/rooms/{id}` → sala
- `POST /api/rooms` — ADMIN — `{ name, capacity, location, hasProjector, hasWhiteboard, hasAirConditioning }`
- `PUT /api/rooms/{id}` — ADMIN
- `DELETE /api/rooms/{id}` — ADMIN
- `GET /api/rooms/{id}/availability?date=YYYY-MM-DD` → `{ roomId, date, slots: [{ time, available, bookedBy, purpose }] }`

### Bookings
- `POST /api/bookings` — `{ roomId, startTime, endTime, purpose }` (ISO datetime: `2026-04-18T10:00:00`)
- `GET /api/bookings/me` → array de reservas do usuário logado
- `GET /api/bookings/room/{roomId}` → reservas de uma sala
- `DELETE /api/bookings/{id}` — cancela (mínimo 2h de antecedência)

### Response de booking:
```json
{
  "id": 1,
  "roomName": "Sala A",
  "roomLocation": "1º Andar",
  "userName": "admin",
  "startTime": "2026-04-18T10:00:00",
  "endTime": "2026-04-18T12:00:00",
  "purpose": "Reunião de equipe",
  "status": "CONFIRMED"
}
```

---

## Arquivos a criar (em ordem)

### 1. `src/main.js`

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia).use(router)

import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
auth.loadUser().finally(() => app.mount('#app'))
```

---

### 2. `src/App.vue`

```vue
<template>
  <RouterView />
</template>
```

---

### 3. `src/services/http.js`

```javascript
import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
```

---

### 4. `src/services/authService.js`

```javascript
import http from './http'

export default {
  login(data) { return http.post('/auth/login', data) },
  register(data) { return http.post('/auth/register', data) },
  me() { return http.get('/auth/me') },
}
```

---

### 5. `src/services/roomService.js`

```javascript
import http from './http'

export default {
  index() { return http.get('/rooms') },
  show(id) { return http.get(`/rooms/${id}`) },
  store(data) { return http.post('/rooms', data) },
  update(id, data) { return http.put(`/rooms/${id}`, data) },
  destroy(id) { return http.delete(`/rooms/${id}`) },
  availability(id, date) { return http.get(`/rooms/${id}/availability`, { params: { date } }) },
}
```

---

### 6. `src/services/bookingService.js`

```javascript
import http from './http'

export default {
  store(data) { return http.post('/bookings', data) },
  myBookings() { return http.get('/bookings/me') },
  byRoom(roomId) { return http.get(`/bookings/room/${roomId}`) },
  cancel(id) { return http.delete(`/bookings/${id}`) },
}
```

---

### 7. `src/stores/auth.js`

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  async function loadUser() {
    if (!token.value) return
    try {
      const res = await authService.me()
      user.value = res.data
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isAuthenticated, isAdmin, setToken, loadUser, logout }
})
```

---

### 8. `src/router/index.js`

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import AuthLayout from '../layouts/AuthLayout.vue'
import AppLayout from '../layouts/AppLayout.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import RoomsPage from '../pages/rooms/RoomsPage.vue'
import RoomAvailabilityPage from '../pages/rooms/RoomAvailabilityPage.vue'
import BookingsPage from '../pages/bookings/BookingsPage.vue'

const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [{ path: '', name: 'login', component: LoginPage }],
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/rooms' },
      { path: 'rooms', name: 'rooms', component: RoomsPage },
      { path: 'rooms/:id/availability', name: 'rooms.availability', component: RoomAvailabilityPage },
      { path: 'bookings', name: 'bookings', component: BookingsPage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'rooms' }
})

export default router
```

---

### 9. `src/layouts/AuthLayout.vue`

Tela centralizada para login. Layout simples, sem sidebar.

```vue
<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div class="card shadow-sm" style="width: 100%; max-width: 420px;">
      <div class="card-body p-4">
        <h4 class="mb-4 text-center fw-bold">
          <i class="bi bi-building me-2"></i>Room Booking
        </h4>
        <RouterView />
      </div>
    </div>
  </div>
</template>
```

---

### 10. `src/layouts/AppLayout.vue`

Layout principal com sidebar e header. Use Bootstrap.

**Sidebar** deve conter:
- Logo / nome do sistema
- Link "Salas" → `/rooms`
- Link "Minhas Reservas" → `/bookings`
- (Se ADMIN) Link "Gerenciar Salas" — pode ser só um badge no menu de Salas

**Header** deve conter:
- Nome do usuário logado (`auth.user?.fullName`)
- Badge do role (`auth.user?.role`)
- Botão logout

**Logout:**
```javascript
function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}
```

---

### 11. `src/pages/auth/LoginPage.vue`

Formulário de login simples com campos `username` e `password`.

```javascript
const form = reactive({ username: '', password: '' })
const error = ref(null)
const loading = ref(false)

async function handleLogin() {
  error.value = null
  loading.value = true
  try {
    const res = await authService.login(form)
    auth.setToken(res.data.token)
    await auth.loadUser()
    router.push({ name: 'rooms' })
  } catch (err) {
    error.value = err.response?.status === 401
      ? 'Usuário ou senha incorretos.'
      : 'Erro ao conectar. Tente novamente.'
  } finally {
    loading.value = false
  }
}
```

---

### 12. `src/pages/rooms/RoomsPage.vue`

Lista todas as salas. Cada sala tem um card com:
- Nome, localização, capacidade
- Ícones para projetor / quadro / ar-condicionado (Bootstrap Icons: `bi-projector`, `bi-easel`, `bi-wind`)
- Badge de status (AVAILABLE = verde, MAINTENANCE = amarelo)
- Botão "Ver Disponibilidade" → redireciona para `/rooms/:id/availability`
- (Se ADMIN) Botões "Editar" e "Excluir"

**Busca de salas:**
```javascript
const rooms = ref([])
onMounted(async () => {
  const res = await roomService.index()
  rooms.value = res.data
})
```

**Modal de criação/edição** (Bootstrap modal):
- Campos: nome, capacidade (number), localização, checkboxes para projetor/quadro/ar-condicionado
- POST `/api/rooms` para criar, PUT `/api/rooms/{id}` para editar

---

### 13. `src/pages/rooms/RoomAvailabilityPage.vue`

Exibe os slots de disponibilidade de uma sala.

**Parâmetros:** `route.params.id` (id da sala), `date` via query ou input de data.

**Comportamento:**
- Input de data (default = hoje)
- Ao mudar a data, busca `GET /api/rooms/:id/availability?date=YYYY-MM-DD`
- Exibe slots em grid: cada slot é um botão/card
  - Verde + "Livre" → clicável para reservar
  - Vermelho + nome do usuário → ocupado (não clicável)
- Ao clicar num slot livre → abre modal para confirmar reserva

**Criação de reserva a partir do slot:**
```javascript
// Slot tem: { time: "10:00", available: true, bookedBy: null, purpose: null }
// startTime = data selecionada + slot.time (ex: "2026-04-18T10:00:00")
// endTime = startTime + 1 hora (ou deixar o usuário escolher duração: 1h, 1.5h, 2h, 3h, 4h)

async function createBooking(slot) {
  const startTime = `${selectedDate.value}T${slot.time}:00`
  // montar endTime com base na duração selecionada
  await bookingService.store({ roomId: route.params.id, startTime, endTime, purpose })
  // recarregar slots
}
```

---

### 14. `src/pages/bookings/BookingsPage.vue`

Lista as reservas do usuário logado.

**Colunas da tabela:** Sala, Local, Data/Hora início, Data/Hora fim, Motivo, Status, Ações

**Status badge:**
- CONFIRMED → verde
- CANCELLED → vermelho
- COMPLETED → azul

**Cancelar reserva:**
- Botão "Cancelar" visível apenas para reservas CONFIRMED
- Chama `DELETE /api/bookings/{id}`
- Erro 400 = reserva muito próxima (menos de 2h) → exibir mensagem

**Formatação de datas:** Use `new Date(dateString).toLocaleString('pt-BR')`

---

## Detalhes de implementação

### Formatação de data para a API
A API espera ISO datetime sem timezone: `2026-04-18T10:00:00`  
Para montar: `${date}T${time}:00` onde date = `2026-04-18` e time = `10:00`

### Erros da API
- `400` → `error.message` no body
- `401` → não autenticado (interceptor já redireciona)
- `403` → sem permissão
- `404` → recurso não encontrado
- `409` → conflito de horário → `error.message` = "Room is already booked for this time slot"

### Bootstrap Icons usados
- `bi-building` — logo/salas
- `bi-projector` — projetor
- `bi-easel` — quadro branco
- `bi-wind` — ar-condicionado
- `bi-people` — capacidade
- `bi-geo-alt` — localização
- `bi-calendar-check` — disponibilidade / reservas
- `bi-box-arrow-right` — logout
- `bi-shield-check` — badge ADMIN

---

## Checklist de entrega

- [ ] `main.js` — inicializa app com Pinia + Router + Bootstrap
- [ ] `App.vue` — só `<RouterView />`
- [ ] `services/http.js` — axios com interceptors
- [ ] `services/authService.js`
- [ ] `services/roomService.js`
- [ ] `services/bookingService.js`
- [ ] `stores/auth.js` — Pinia store com token, user, isAdmin
- [ ] `router/index.js` — rotas com guard
- [ ] `layouts/AuthLayout.vue` — card centralizado
- [ ] `layouts/AppLayout.vue` — sidebar + header
- [ ] `pages/auth/LoginPage.vue` — formulário de login
- [ ] `pages/rooms/RoomsPage.vue` — cards de salas + modal CRUD (admin)
- [ ] `pages/rooms/RoomAvailabilityPage.vue` — grid de slots + modal de reserva
- [ ] `pages/bookings/BookingsPage.vue` — tabela de reservas + cancelar
- [ ] Remover arquivos padrão do Vite: `src/assets/vue.svg`, `src/components/HelloWorld.vue`, `src/style.css`
- [ ] Limpar `public/vite.svg`

---

## Como testar

1. `npm run dev` em `/var/www/room-booking-frontend`
2. A API Spring Boot deve estar rodando em `http://localhost:8080`
3. Acesse `http://localhost:5173`
4. Login com `admin` / `admin123` (já criado no banco)
