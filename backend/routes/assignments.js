// routes/assignments.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken, isAdmin } = require("../middleware/auth");

// admin creates an assignment
router.post("/create", verifyToken, isAdmin, async (req, res) => {
  const { title, description, due_date, onedrive_link, assigned_to, group_ids } = req.body;

  if (!title || !onedrive_link) {
    return res.status(400).json({ message: "Title and OneDrive link are required" });
  }

  try {
    const newAssignment = await pool.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, due_date, onedrive_link, assigned_to || "all", req.user.id]
    );

    const assignment = newAssignment.rows[0];

    // figure out which groups this assignment applies to
    let targetGroups = [];
    if (assigned_to === "specific" && group_ids && group_ids.length > 0) {
      targetGroups = group_ids;
      // save the mapping too
      for (const gid of group_ids) {
        await pool.query(
          "INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)",
          [assignment.id, gid]
        );
      }
    } else {
      // assigned to all -> get every group
      const allGroups = await pool.query("SELECT id FROM groups");
      targetGroups = allGroups.rows.map((g) => g.id);
    }

    // create a pending submission row for each target group
    for (const gid of targetGroups) {
      await pool.query(
        "INSERT INTO submissions (assignment_id, group_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING",
        [assignment.id, gid]
      );
    }

    res.status(201).json({ message: "Assignment created", assignment });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not create assignment" });
  }
});

// edit assignment
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, onedrive_link } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE assignments SET title = $1, description = $2, due_date = $3, onedrive_link = $4
       WHERE id = $5 RETURNING *`,
      [title, description, due_date, onedrive_link, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment updated", assignment: updated.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not update assignment" });
  }
});

// get all assignments (both student and admin can view)
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM assignments ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not fetch assignments" });
  }
});

module.exports = router;
