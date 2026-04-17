# Room Booking Frontend

Interface web para o sistema de reserva de salas corporativas.  
Consome a [API Spring Boot](https://github.com/GuilhermeKAC/room-booking-system) via JWT, com autenticação, listagem de salas, consulta de disponibilidade e gerenciamento de reservas.

---

## Stack

| | Tecnologia |
|---|---|
| Framework | Vue 3 (Composition API + script setup) |
| Roteamento | Vue Router 4 |
| State management | Pinia |
| HTTP client | Axios |
| UI | Bootstrap 5 + Bootstrap Icons |
| Build | Vite |

---

## Pré-requisitos

- Node.js 18+
- A [API](https://github.com/GuilhermeKAC/room-booking-system) rodando em `http://localhost:8080`

---

## Como rodar

```bash
# Clone o repositório
git clone https://github.com/GuilhermeKAC/room-booking-frontend.git
cd room-booking-frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em `http://localhost:5173`.

> O Vite está configurado com proxy: requisições para `/api/*` são redirecionadas para `http://localhost:8080` — sem necessidade de configurar CORS.

---

## Funcionalidades

- Login com JWT (token salvo no `localStorage`)
- Listagem de salas com atributos (capacidade, localização, projetor, quadro, ar-condicionado)
- Consulta de disponibilidade por sala e data (slots de 30 minutos)
- Criação de reservas a partir dos slots disponíveis
- Listagem e cancelamento das próprias reservas
- Gerenciamento de salas (criar, editar, remover) — restrito a ADMIN

---

## Estrutura do projeto

```
src/
├── layouts/
│   ├── AppLayout.vue        # Sidebar + header (rotas protegidas)
│   └── AuthLayout.vue       # Card centralizado (login)
├── pages/
│   ├── auth/
│   │   └── LoginPage.vue
│   ├── rooms/
│   │   ├── RoomsPage.vue
│   │   └── RoomAvailabilityPage.vue
│   └── bookings/
│       └── BookingsPage.vue
├── router/
│   └── index.js             # Rotas + guard de autenticação
├── services/
│   ├── http.js              # Axios com interceptors (token + 401)
│   ├── authService.js
│   ├── roomService.js
│   └── bookingService.js
└── stores/
    └── auth.js              # Pinia — token, usuário, isAdmin
```

---

## Autenticação

O token JWT é armazenado no `localStorage` e enviado automaticamente em todas as requisições via interceptor do Axios:

```
Authorization: Bearer <token>
```

Ao receber `401`, o interceptor limpa o token e redireciona para `/login`.

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Tela de login |
| `/rooms` | Autenticado | Lista de salas |
| `/rooms/:id/availability` | Autenticado | Disponibilidade e reserva |
| `/bookings` | Autenticado | Minhas reservas |

---

## Build para produção

```bash
npm run build
```

Os arquivos gerados ficam em `dist/`. Configure o servidor web para servir o `index.html` para todas as rotas (necessário para Vue Router em modo history).
