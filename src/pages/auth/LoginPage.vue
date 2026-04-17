<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import authService from '../../services/authService'

const auth = useAuthStore()
const router = useRouter()

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
</script>

<template>
  <form @submit.prevent="handleLogin">
    <div v-if="error" class="alert alert-danger py-2 small mb-4">
      {{ error }}
    </div>

    <div class="mb-3">
      <label class="form-label small fw-bold">Usuário</label>
      <input 
        v-model="form.username" 
        type="text" 
        class="form-control" 
        placeholder="Digite seu usuário" 
        required
        :disabled="loading"
      >
    </div>

    <div class="mb-4">
      <label class="form-label small fw-bold">Senha</label>
      <input 
        v-model="form.password" 
        type="password" 
        class="form-control" 
        placeholder="Digite sua senha" 
        required
        :disabled="loading"
      >
    </div>

    <button 
      type="submit" 
      class="btn btn-primary w-100 py-2 fw-bold" 
      :disabled="loading"
    >
      <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
      Entrar
    </button>
  </form>
</template>
