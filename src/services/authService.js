import http from './http'

export default {
  login(data) { return http.post('/auth/login', data) },
  register(data) { return http.post('/auth/register', data) },
  me() { return http.get('/auth/me') },
}
