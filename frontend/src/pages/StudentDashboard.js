// StudentDashboard.js
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import GroupManagement from "../components/GroupManagement";
import StudentAssignments from "../components/StudentAssignments";

export default function StudentDashboard() {
  const [group, setGroup] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

        <GroupManagement onGroupChange={setGroup} />
        <StudentAssignments hasGroup={!!group} />
      </div>
    </div>
  );
}
