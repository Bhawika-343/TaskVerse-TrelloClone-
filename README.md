# TaskVerse - Full-Stack Trello Clone

TaskVerse is a premium, full-stack Kanban-style project management application designed to replicate and enhance Trello's core functionality. It features a stunning glassmorphic UI, real-time drag-and-drop mechanics, and persistent data storage.

## 🚀 Features

- **Dynamic Board & List Management**: Create boards and lists dynamically to organize your workflow.
- **Drag-and-Drop Interface**: Seamlessly drag cards between lists and reorder them within lists using `@hello-pangea/dnd`.
- **Premium UI/UX**: Aesthetic dark-themed design with vibrant gradients, glassmorphism, and smooth micro-animations.
- **Advanced Card Modals**: Click on any card to add detailed descriptions, attach links, manage checklists, set due dates, assign labels, and add comments.
- **Filtering & Search**: Quickly find tasks by searching titles, or filtering by assigned labels and members.
- **Hybrid Data Persistence**: Core structural data (boards, lists, basic cards) is persisted in a MySQL database, while UI-specific enhancements (custom backgrounds, covers, complex card metadata) are efficiently cached in the client's local storage for immediate responsiveness.

## 🛠️ Tech Stack

**Frontend:**
- React (bootstrapped with Vite)
- Vanilla CSS3 (Custom Design System)
- `@hello-pangea/dnd` (for Drag-and-Drop mechanics)
- Axios (for API communication)

**Backend:**
- Node.js & Express.js
- MySQL2 (Database Driver)
- dotenv (Environment configuration)

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MySQL database running locally or in the cloud.

### 1. Database Setup
1. Open your MySQL client or CLI.
2. Run the provided SQL script to create the necessary tables and seed initial data:
   ```bash
   mysql -u root -p < backend/seed.sql
   ```
   *(Alternatively, log into MySQL and execute the contents of `backend/seed.sql` manually).*

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `backend` directory with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=taskverse
   DB_PORT=3306
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   *The server will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the project root:
   ```bash
   # assuming you are in the project root
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory to point to your backend (optional, defaults to localhost:5000):
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open the local link (usually `http://localhost:5173`) in your browser.

## 🧠 Assumptions & Design Decisions

- **Hybrid Data Model:** To optimize backend complexity while delivering a premium feature-rich UI, core entities (Boards, Lists, Cards) are strictly governed by the MySQL relational database. Supplementary metadata (Attachments, Comments, Checklists, Themes, Covers) utilizes a Client-Side Cache strategy via LocalStorage. This allows for rapid iteration of UI features without requiring constant database schema migrations.
- **Authentication:** User authentication is currently mocked for demonstration purposes (`mockMembers` in `App.jsx`), enabling immediate task assignment functionality without requiring a complex OAuth setup process.
- **Graceful Fallbacks:** The frontend API requests are wrapped in `try/catch` and fallback elegantly. If the backend is unreachable, the application logs a warning and continues to provide an offline experience to prevent UI crashes.
- **System Architecture:** Vercel is used for hosting the optimized frontend build, while the Node.js API must be hosted on a cloud provider like Render or Railway that supports stateful connections and continuous processes.
