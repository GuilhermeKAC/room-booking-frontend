import http from './http'

export default {
  index() { return http.get('/rooms') },
  show(id) { return http.get(`/rooms/${id}`) },
  store(data) { return http.post('/rooms', data) },
  update(id, data) { return http.put(`/rooms/${id}`, data) },
  destroy(id) { return http.delete(`/rooms/${id}`) },
  availability(id, date) { return http.get(`/rooms/${id}/availability`, { params: { date } }) },
}
