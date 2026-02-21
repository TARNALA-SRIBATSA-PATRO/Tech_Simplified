---
title: Tech Simplified Backend
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# Tech Simplified — Spring Boot Backend API

REST API for the Tech Simplified blog platform.  
Built with **Spring Boot 3**, **PostgreSQL (Neon)**, **JWT Auth**, and **Gmail SMTP**.

## Endpoints
- `GET  /api/blogs` — list all blogs
- `GET  /api/blogs/{id}` — get a blog
- `POST /api/admin/otp` — request admin OTP
- `POST /api/admin/login` — verify OTP & get JWT
- `POST /api/subscribers/subscribe` — subscribe to newsletter
