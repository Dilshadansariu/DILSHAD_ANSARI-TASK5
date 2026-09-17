// routes/submissions.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken, isStudent } = require("../middleware/auth");

// student confirms submission for their group
// frontend does the "two step" (are you sure?) part, this endpoint just marks it done
router.post("/:assignmentId/confirm", verifyToken, isStudent, async (req, res) => {
  const { assignmentId } = req.params;
  const userId = req.user.id;

  try {
    // find student's group
    const groupRes = await pool.query(
      "SELECT group_id FROM group_members WHERE student_id = $1 LIMIT 1",
      [userId]
    );

    if (groupRes.rows.length === 0) {
      return res.status(400).json({ message: "You are not part of any group yet" });
    }

    const groupId = groupRes.rows[0].group_id;

    const updated = await pool.query(
      `UPDATE submissions
       SET status = 'submitted', confirmed_by = $1, submitted_at = NOW()
       WHERE assignment_id = $2 AND group_id = $3
       RETURNING *`,
      [userId, assignmentId, groupId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Submission record not found for your group" });
    }

    res.json({ message: "Submission confirmed!", submission: updated.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not confirm submission" });
  }
});

// get submission status for the logged in student's group (for progress bar)
router.get("/my-group-status", verifyToken, isStudent, async (req, res) => {
  const userId = req.user.id;

  try {
    const groupRes = await pool.query(
      "SELECT group_id FROM group_members WHERE student_id = $1 LIMIT 1",
      [userId]
    );

    if (groupRes.rows.length === 0) {
      return res.json({ submissions: [], progress: 0 });
    }

    const groupId = groupRes.rows[0].group_id;

    const subsRes = await pool.query(
      `SELECT s.*, a.title FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.group_id = $1
       ORDER BY a.created_at DESC`,
      [groupId]
    );

    const total = subsRes.rows.length;
    const done = subsRes.rows.filter((s) => s.status === "submitted").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    res.json({ submissions: subsRes.rows, progress });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not fetch status" });
  }
});

// admin: get all submission statuses grouped by assignment, plus simple analytics
router.get("/all", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.status, s.submitted_at, a.id as assignment_id, a.title,
              g.id as group_id, g.name as group_name
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN groups g ON s.group_id = g.id
       ORDER BY a.created_at DESC`
    );

    // basic analytics - total submitted vs pending
    const total = result.rows.length;
    const submitted = result.rows.filter((r) => r.status === "submitted").length;
    const pending = total - submitted;

    res.json({
      submissions: result.rows,
      analytics: {
        total,
        submitted,
        pending,
        completionRate: total === 0 ? 0 : Math.round((submitted / total) * 100),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not fetch submissions" });
  }
});

module.exports = router;
