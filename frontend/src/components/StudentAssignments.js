// StudentAssignments.js - shows assignments + two step submission confirm
import React, { useState, useEffect } from "react";
import api from "../api/api";
import ProgressBar from "../components/ProgressBar";

export default function StudentAssignments({ hasGroup }) {
  const [assignments, setAssignments] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [progress, setProgress] = useState(0);
  // keeps track of which assignment is in "confirm step 2" mode
  const [confirmingId, setConfirmingId] = useState(null);

  async function loadData() {
    try {
      const [assignRes, statusRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/submissions/my-group-status"),
      ]);
      setAssignments(assignRes.data);
      setStatusList(statusRes.data.submissions);
      setProgress(statusRes.data.progress);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getStatusForAssignment(assignmentId) {
    const found = statusList.find((s) => s.assignment_id === assignmentId);
    return found ? found.status : "pending";
  }

  // step 1 click - just show the confirm button
  function handleFirstClick(id) {
    setConfirmingId(id);
  }

  // step 2 click - actually calls the API
  async function handleFinalConfirm(id) {
    try {
      await api.post(`/submissions/${id}/confirm`);
      setConfirmingId(null);
      loadData(); // refresh progress + status
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong while confirming");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-2">Assignments</h2>

      <p className="text-sm text-gray-600 mb-1">Group Progress</p>
      <ProgressBar percent={progress} />

      {!hasGroup && (
        <p className="text-yellow-600 text-sm mt-2 mb-4">
          You are not in a group yet. Create/join one above to confirm submissions.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {assignments.length === 0 && <p className="text-gray-500">No assignments posted yet.</p>}

        {assignments.map((a) => {
          const status = getStatusForAssignment(a.id);
          return (
            <div key={a.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <p className="text-gray-600 text-sm">{a.description}</p>
                  {a.due_date && (
                    <p className="text-sm text-gray-500">
                      Due: {new Date(a.due_date).toDateString()}
                    </p>
                  )}
                  <a
                    href={a.onedrive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline text-sm"
                  >
                    OneDrive Submission Link
                  </a>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    status === "submitted"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {status === "submitted" ? "Submitted ✅" : "Pending"}
                </span>
              </div>

              {status !== "submitted" && hasGroup && (
                <div className="mt-3">
                  {confirmingId === a.id ? (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-700">Are you sure you've submitted?</span>
                      <button
                        onClick={() => handleFinalConfirm(a.id)}
                        className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700"
                      >
                        Yes, confirm
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="bg-gray-200 text-sm px-3 py-1 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFirstClick(a.id)}
                      className="bg-indigo-600 text-white text-sm px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Yes, I have submitted
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
