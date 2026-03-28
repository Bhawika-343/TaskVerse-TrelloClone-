const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ GET BOARDS WITH LISTS + CARDS
app.get("/boards", async (req, res) => {
  try {
    const [boards] = await db.promise().query("SELECT * FROM boards");

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
    res.status(500).json({ error: "Server error" });
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