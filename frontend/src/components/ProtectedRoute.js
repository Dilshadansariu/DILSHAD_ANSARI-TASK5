// ProtectedRoute.js - wraps pages that need login (and optionally a specific role)
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // if a specific role is required and user doesn't have it, kick them out
  if (role && user.role !== role) {
    return <Navigate to="/login" />;
  }

  return children;
}
