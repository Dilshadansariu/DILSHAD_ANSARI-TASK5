// routes/groups.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken, isStudent } = require("../middleware/auth");

// create a new group (student only) - creator is auto added as member
router.post("/create", verifyToken, isStudent, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Group name is required" });
  }

  try {
    const newGroup = await pool.query(
      "INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *",
      [name, userId]
    );

    const groupId = newGroup.rows[0].id;

    // add creator as first member
    await pool.query(
      "INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)",
      [groupId, userId]
    );

    res.status(201).json({ message: "Group created", group: newGroup.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not create group" });
  }
});

// add a member to group by email
router.post("/:groupId/add-member", verifyToken, isStudent, async (req, res) => {
  const { groupId } = req.params;
  const { email } = req.body;

  try {
    // find the student by email
    const studentRes = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1 AND role = 'student'",
      [email]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: "No student found with this email" });
    }

    const student = studentRes.rows[0];

    // check if already a member
    const already = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND student_id = $2",
      [groupId, student.id]
    );

    if (already.rows.length > 0) {
      return res.status(400).json({ message: "Student already in this group" });
    }

    await pool.query(
      "INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)",
      [groupId, student.id]
    );

    res.json({ message: "Member added", student });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not add member" });
  }
});

// get logged in student's group (assuming one group per student for now)
router.get("/my-group", verifyToken, isStudent, async (req, res) => {
  const userId = req.user.id;

  try {
    const groupRes = await pool.query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.student_id = $1
       LIMIT 1`,
      [userId]
    );

    if (groupRes.rows.length === 0) {
      return res.json({ group: null, members: [] });
    }

    const group = groupRes.rows[0];

    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN group_members gm ON u.id = gm.student_id
       WHERE gm.group_id = $1`,
      [group.id]
    );

    res.json({ group, members: membersRes.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not fetch group" });
  }
});

// admin: get all groups with member count
router.get("/all", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, COUNT(gm.id) as member_count
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not fetch groups" });
  }
});

module.exports = router;
