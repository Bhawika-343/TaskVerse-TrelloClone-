const express = require("express");
const cors = require("cors");
const db = require("./db");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ GET BOARDS WITH LISTS + CARDS
app.get("/boards", async (req, res) => {
  try {
    const [boards] = await db.promise().query("SELECT * FROM boards");

    if (boards.length === 0) {
        return res.json({ status: "UNINITIALIZED", message: "Database is connected but empty. Please seed." });
    }

    for (let board of boards) {
      const [lists] = await db
        .promise()
        .query("SELECT * FROM lists WHERE board_id = ?", [board.id]);

      for (let list of lists) {
        const [cards] = await db
          .promise()
          .query("SELECT * FROM cards WHERE list_id = ?", [list.id]);

        list.cards = cards;
      }

      board.lists = lists;
    }

    res.json(boards);
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "ERROR", error: "Database connection failed or MySQL is offline." });
  }
});

// ✅ SEED DATABASE (Run the seed.sql script)
app.post("/seed", async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'seed.sql');
    const script = fs.readFileSync(scriptPath, 'utf8');

    // Run the entire script (multipleStatements: true is required in db.js)
    await db.promise().query(script);
    
    res.json({ success: true, message: "Database seeded perfectly! 🚀" });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: "Failed to seed database: " + err.message });
  }
});

// ✅ ADD CARD
app.post("/cards", async (req, res) => {
  try {
    const { title, listId } = req.body;

    const id = "c-" + Date.now();

    await db
      .promise()
      .query(
        "INSERT INTO cards (id, title, list_id) VALUES (?, ?, ?)",
        [id, title, listId]
      );

    res.json({ id, title, list_id: listId });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error adding card" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});