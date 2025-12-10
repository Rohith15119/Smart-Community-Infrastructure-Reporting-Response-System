#  🏙️ Smart-Community-Infrastructure-Reporting-Response-System

A full-stack web application designed to help citizens report public infrastructure issues (potholes, broken streetlights, sanitation issues, unsafe sidewalks, drainage problems, etc.) and enable authorities to respond efficiently. The platform provides a unified and transparent communication channel between citizens and administrators.

## ✨ Features
### 👥 Citizen Module

Register & login using secure authentication

Submit infrastructure complaints with details and media

Track complaint status in real-time

User dashboard to view all submitted reports

🛠️ Admin Module

Admin login with JWT authentication

View, verify, and update complaint statuses

Manage citizen reports and overall system data

🔒 Security

Passwords encrypted using bcryptjs

## 🧩 Tech Stack
### 🌐 Frontend (React)

React for UI

react-router-dom for client-side routing

React Context API for global state management

react-hook-form for form handling

axios for API communication

LocalStorage session management (JSON.parse(localStorage.getItem("user")))

Navigation using useNavigate()
Secure routes protected using JWT-based authentication

Role-based access (Citizen/Admin)

## ⚙️ Backend (Node.js + Express)

Node.js, Express.js for server & API creation

MongoDB with Mongoose for database

JWT for authentication

bcryptjs for password hashing

Middleware-based token verification

Mongoose schemas for Admin & Citizen

## 🚀 How It Works

Citizens submit complaints.

Admin verifies and updates the complaint status.

Status updates are reflected on the citizen dashboard.

JWT tokens protect private routes.
