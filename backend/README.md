# Tech Simplified — Spring Boot Backend API

REST API for the Tech Simplified blog platform.  
Built with **Spring Boot 3**, **PostgreSQL (Neon)**, **JWT Auth**, and **Gmail SMTP**.

## 🚀 Deployment

The backend is deployed on **[Railway](https://railway.app)** using Docker.  
Permanent URL: `https://<your-service>.up.railway.app`

See [`DEPLOY_RAILWAY.md`](../DEPLOY_RAILWAY.md) in the root for full deployment instructions.

## 📡 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/blogs` | List all published blogs |
| `GET`  | `/api/blogs/{slug}` | Get a blog by slug |
| `POST` | `/api/admin/auth/request-otp` | Request admin OTP |
| `POST` | `/api/admin/auth/verify-otp` | Verify OTP & get JWT |
| `POST` | `/api/subscribers/subscribe` | Subscribe to newsletter |

## 🛠️ Local Development

```bash
# From the backend/ directory
./mvnw spring-boot:run
```

Make sure to set environment variables (see `.env.example`).
