# 📌 Job Application Tracker (Mini CRM)

A simple yet powerful full-stack job application tracking system with real-time updates, role-based access, and clean UI/UX. Built using the **MERN stack** and **Socket.IO**.

---

### 📌 How It Works (Admin + User Roles)

#### 👑 Admin
- Can create job opportunities (job postings) without assigning them to specific users.
- Can view all applications submitted by different users for each job posting.
- Can update the status of any user's job application (e.g., move from "Applied" to "Interview", "Offer", etc.).

#### 👤 User
- Can view all **open job postings** that they haven't applied to yet.
- Can **apply** to any open job (once per job).
- Can track their own job applications and status history via the dashboard.

#### 🔔 Real-Time Updates
- When an admin updates a user's job application, a **real-time Socket.IO notification** is sent.
- If the user is currently logged in, the update appears instantly on their dashboard.


## 🧠 Features

### 👤 User Authentication
- JWT-based login/signup
- Role-based access (Applicant / Admin)

### 📂 Job Application Management
- Add, update, delete, and view job applications
- Fields: `Company`, `Role`, `Status`, `Applied Date`, `Notes`
- Status options: `Applied`, `Interview`, `Offer`, `Rejected`, `Accepted`

### 📋 List View & Filters
- View all job applications
- Filter by status
- Sort by applied date

### ⚡ Real-Time Notifications
- Real-time updates via WebSocket (Socket.IO)
- Notification shown on UI panel
- Optional email notification (extendable)

---

## 🔧 Tech Stack

| Layer      | Tech                      |
|------------|---------------------------|
| Frontend   | React, TailwindCSS, Socket.IO Client |
| Backend    | Node.js, Express, Socket.IO |
| Database   | MongoDB (Mongoose)        |
| Auth       | JWT (JSON Web Tokens)     |
| Realtime   | WebSocket via Socket.IO   |

---

## 📁 Folder Structure

```
job-tracker/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── socket.js
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   └── App.jsx
```

---

## ⚙️ Setup Instructions

### 🔌 Backend (Express + MongoDB + Socket.IO)

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file**
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:3000
   ```

3. **Run server**
   ```bash
   npm run dev
   ```

4. **Socket.IO setup**
   WebSocket initialized in `socket.js` and injected into Express app.

   ```js
   // backend/socket.js
   let io;

   module.exports = {
     init: (server) => {
       io = require('socket.io')(server, {
         cors: {
           origin: process.env.CLIENT_URL,
           methods: ['GET', 'POST']
         }
       });
       return io;
     },
     getIO: () => {
       if (!io) throw new Error('Socket.io not initialized');
       return io;
     }
   };
   ```

   In `server.js`:
   ```js
   const server = app.listen(PORT, () => console.log(`Server running on ${PORT}`));
   const io = require('./socket').init(server);
   ```

---

### 🌐 Frontend (React + TailwindCSS + Socket.IO Client)

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Connect to Socket.IO**
   ```js
   // frontend/src/socket.js
   import { io } from "socket.io-client";

   const socket = io(import.meta.env.VITE_BACKEND_URL);
   export default socket;
   ```

3. **Listen for updates**
   ```js
   // Example in Dashboard.jsx
   useEffect(() => {
     socket.on('jobUpdate', (data) => {
       toast.info(data.message);
       // Optionally refetch jobs
     });

     return () => {
       socket.off('jobUpdate');
     };
   }, []);
   ```

4. **Run frontend**
   ```bash
   npm run dev
   ```

---

## ✅ Example API Endpoints

| Method | Endpoint                 | Description                 |
|--------|--------------------------|-----------------------------|
| POST   | /api/auth/signup         | User Registration           |
| POST   | /api/auth/login          | User Login                  |
| GET    | /api/jobs                | Get All Jobs (User/Admin)   |
| POST   | /api/jobs                | Create Job Application      |
| PUT    | /api/jobs/:id            | Update Job (Owner/Admin)    |
| DELETE | /api/jobs/:id            | Delete Job                  |

---

## ✨ Future Enhancements

- Email notification on status change
- Export jobs to CSV
- Admin dashboard charts
- Multi-user organization support

---

## 🙌 Contributors

Built with 💖 by [Your Name] and the developer community.

---

## 📜 License

This project is licensed under the MIT License.
