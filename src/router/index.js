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
