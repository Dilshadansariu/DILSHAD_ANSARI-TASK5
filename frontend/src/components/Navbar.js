// Navbar.js
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-indigo-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
      <h1 className="font-bold text-lg">Joineazy</h1>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.name} ({user.role})
          </span>
          <button
            onClick={handleLogout}
            className="bg-white text-indigo-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
