// GroupManagement.js - lets a student create a group / add members
import React, { useState, useEffect } from "react";
import api from "../api/api";

export default function GroupManagement({ onGroupChange }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function fetchGroup() {
    try {
      const res = await api.get("/groups/my-group");
      setGroup(res.data.group);
      setMembers(res.data.members);
      if (onGroupChange) onGroupChange(res.data.group);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/groups/create", { name: groupName });
      setGroupName("");
      fetchGroup();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not create group");
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post(`/groups/${group.id}/add-member`, { email: memberEmail });
      setMemberEmail("");
      fetchGroup();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not add member");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">My Group</h2>

      {msg && <p className="text-red-500 text-sm mb-2">{msg}</p>}

      {!group ? (
        <form onSubmit={handleCreateGroup} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
            required
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Create Group
          </button>
        </form>
      ) : (
        <div>
          <p className="mb-2">
            Group Name: <span className="font-semibold">{group.name}</span>
          </p>

          <p className="font-semibold mb-1">Members:</p>
          <ul className="list-disc pl-5 mb-4">
            {members.map((m) => (
              <li key={m.id}>
                {m.name} - {m.email}
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddMember} className="flex gap-2">
            <input
              type="email"
              placeholder="Add member by email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
              required
            />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
