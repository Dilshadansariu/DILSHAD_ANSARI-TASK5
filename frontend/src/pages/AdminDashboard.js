// AdminDashboard.js
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/api";

export default function AdminDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, submitted: 0, pending: 0, completionRate: 0 });

  // form state for new assignment
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [onedriveLink, setOnedriveLink] = useState("");
  const [assignedTo, setAssignedTo] = useState("all");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [msg, setMsg] = useState("");

  // for editing
  const [editingId, setEditingId] = useState(null);

  async function loadAll() {
    try {
      const [aRes, gRes, sRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/groups/all"),
        api.get("/submissions/all"),
      ]);
      setAssignments(aRes.data);
      setGroups(gRes.data);
      setSubmissions(sRes.data.submissions);
      setAnalytics(sRes.data.analytics);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setOnedriveLink("");
    setAssignedTo("all");
    setSelectedGroups([]);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      if (editingId) {
        // edit mode
        await api.put(`/assignments/${editingId}`, {
          title,
          description,
          due_date: dueDate,
          onedrive_link: onedriveLink,
        });
      } else {
        // create mode
        await api.post("/assignments/create", {
          title,
          description,
          due_date: dueDate,
          onedrive_link: onedriveLink,
          assigned_to: assignedTo,
          group_ids: selectedGroups,
        });
      }

      resetForm();
      loadAll();
    } catch (err) {
      setMsg(err.response?.data?.message || "Something went wrong");
    }
  }

  function handleEditClick(a) {
    setEditingId(a.id);
    setTitle(a.title);
    setDescription(a.description || "");
    setDueDate(a.due_date ? a.due_date.split("T")[0] : "");
    setOnedriveLink(a.onedrive_link);
  }

  function toggleGroupSelect(groupId) {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin / Professor Dashboard</h1>

        {/* analytics summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-2xl font-bold text-indigo-600">{groups.length}</p>
            <p className="text-sm text-gray-500">Total Groups</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-2xl font-bold text-indigo-600">{assignments.length}</p>
            <p className="text-sm text-gray-500">Assignments</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.submitted}</p>
            <p className="text-sm text-gray-500">Submitted</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-2xl font-bold text-yellow-600">{analytics.completionRate}%</p>
            <p className="text-sm text-gray-500">Completion Rate</p>
          </div>
        </div>

        {/* create / edit assignment form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Assignment" : "Create New Assignment"}
          </h2>

          {msg && <p className="text-red-500 text-sm mb-2">{msg}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Assignment Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows="2"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="url"
              placeholder="OneDrive Link"
              value={onedriveLink}
              onChange={(e) => setOnedriveLink(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />

            {!editingId && (
              <>
                <label className="block text-sm font-semibold">Assign to</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">All Groups</option>
                  <option value="specific">Specific Groups</option>
                </select>

                {assignedTo === "specific" && (
                  <div className="border rounded p-3 max-h-40 overflow-y-auto">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 text-sm mb-1">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(g.id)}
                          onChange={() => toggleGroupSelect(g.id)}
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                {editingId ? "Update Assignment" : "Create Assignment"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* assignment list */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">All Assignments</h2>
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-gray-500">
                    Due: {a.due_date ? new Date(a.due_date).toDateString() : "No due date"}
                  </p>
                </div>
                <button
                  onClick={() => handleEditClick(a)}
                  className="text-indigo-600 text-sm font-semibold hover:underline"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* group-wise submission tracking table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Group Submission Tracker</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Assignment</th>
                <th className="p-2 border">Group</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 border">{s.title}</td>
                  <td className="p-2 border">{s.group_name}</td>
                  <td className="p-2 border">
                    <span
                      className={
                        s.status === "submitted"
                          ? "text-green-600 font-semibold"
                          : "text-yellow-600 font-semibold"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-2 border">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
