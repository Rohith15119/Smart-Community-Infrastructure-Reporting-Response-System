// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Track from "./pages/Track";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register.jsx";
import "./App.css";
import All_Reports from "./pages/All_Reports.jsx";
import { AuthProvider } from "./auth/AuthContext"; // NEW

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report" element={<Report />} />
          <Route path="/track" element={<Track />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/all-reports" element={<All_Reports />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
