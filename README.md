# Tech Simplified

A modern tech blog platform built with React, TypeScript, Vite, and Tailwind CSS.

## 🚀 Project Overview

**Tech Simplified** is a clean and performant blogging platform for sharing tech insights, tutorials, and stories. It features an admin dashboard for managing posts and a public-facing frontend for readers.

## 🛠️ Tech Stack

- **React 18** — UI library
- **TypeScript** — Type safety
- **Vite** — Lightning-fast dev server & bundler
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Accessible component library
- **Framer Motion** — Animations
- **React Router** — Client-side routing

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd Tech_Simplified

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## 📝 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── ui/          # shadcn/ui base components
│   ├── BlogCard.tsx
│   ├── Navbar.tsx
│   └── NewsletterSection.tsx
├── pages/           # Route pages
│   ├── Index.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminLogin.tsx
│   ├── BlogDetail.tsx
│   └── NotFound.tsx
├── lib/             # Utilities & data store
└── hooks/           # Custom React hooks
```

## 🚢 Deployment

| Service  | Platform | URL |
|----------|----------|-----|
| **Frontend** | [Vercel](https://vercel.com) | `https://tech-simplified-sribatsa.vercel.app` |
| **Backend**  | [Railway](https://railway.app) | `https://<your-service>.up.railway.app` |
| **Database** | [Neon](https://neon.tech) | PostgreSQL (managed) |

See **[`DEPLOY_RAILWAY.md`](./DEPLOY_RAILWAY.md)** for the full step-by-step Railway deployment guide.

Build the frontend production bundle:

```sh
npm run build
```

## � Author

**Tarnala Sribatsa Patro**

🌐 Portfolio: [sribatsa.vercel.app](https://sribatsa.vercel.app/)

## �📄 License

This project is open source. Feel free to use and modify it for your own purposes.
