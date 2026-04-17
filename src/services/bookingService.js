import http from './http'

export default {
  store(data) { return http.post('/bookings', data) },
  myBookings() { return http.get('/bookings/me') },
  byRoom(roomId) { return http.get(`/bookings/room/${roomId}`) },
  cancel(id) { return http.delete(`/bookings/${id}`) },
}
