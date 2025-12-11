# DevMeet

A modern, full-stack meeting scheduling and video conferencing application built with Next.js, Prisma, and Jitsi Meet.

## 🚀 Features

- **Authentication**: Secure user authentication using JWT with HTTP-only cookies.
- **Dashboard**:
  - Overview of upcoming meetings and usage statistics.
  - Beautiful, responsive UI with modern gradient designs.
  - Quick access to create meetings and copy booking links.
- **Calendar**:
  - Visual calendar interface to manage and view scheduled meetings.
  - Filter meetings by date.
- **Video Conferencing**:
  - Integrated Jitsi Meet for high-quality video calls.
  - Custom meeting rooms with minimal setup.
- **Notifications**:
  - Real-time notifications for upcoming meetings.
  - Persistent notification history with read/unread status.
  - Notifications worker powered by BullMQ and Redis.
- **Settings**:
  - Profile management with avatar customization.
  - Modern, accessible form UI.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Jotai](https://jotai.org/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Queue**: [BullMQ](https://bullmq.io/) & [Redis](https://redis.io/)
- **Video**: [Jitsi Meet](https://jitsi.org/jitsi-meet/)

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for PostgreSQL and Redis)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/dev-meet.git
   cd dev-meet
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/devmeet?schema=public"

   # Redis
   REDIS_URL="redis://localhost:6379"

   # Authentication
   JWT_SECRET="your-secret-key"

   # Jitsi
   NEXT_PUBLIC_MEET_DOMAIN="meet.jit.si"
   MEET_SECRET="your-jitsi-secret"
   MEET_APP_ID="your-app-id"
   ```

4. **Start the database and Redis**

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Running the Application

You need to run both the Next.js server and the background worker for notifications.

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Start the notification worker** (in a separate terminal)
   ```bash
   npm run worker:notify
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📝 Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run worker:notify`: Starts the background worker for processing notifications.
- `npm run lint`: Runs the linter.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
