"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const AdminDashboardPage = () => {
  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/admin/login">
      <DashboardLayout>
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p>Welcome to the admin dashboard.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboardPage;
