import { useEffect, useState } from "react";
import { fetchStats, fetchTasks, updateTask } from "./api";
import TaskItem from "./TaskItem";

const USERS = ["alice", "bob", "carol"];

export default function App() {
  const [user, setUser] = useState("alice");
  const [status, setStatus] = useState("");
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const loadStats = (username) =>
    fetchStats(username)
      .then(setStats)
      .catch((err) => setError(err.message));

  // Stats belong to the logged-in user, so reload them whenever the user changes.
  useEffect(() => {
    loadStats(user);
  }, [user]);

  useEffect(() => {
    setError(null);
    fetchTasks(user, status)
      .then((data) => setTasks(data.results))
      .catch((err) => setError(err.message));
  }, [user]);

  const handleMarkDone = async (task) => {
    try {
      await updateTask(user, task.id, { status: "done" });
      task.status = "done";
      task.is_overdue = false;
      setTasks(tasks);
      loadStats(user); // counts change after a task is marked done
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Task Tracker</h1>
      <div className="controls">
        <label>
          Logged in as{" "}
          <select value={user} onChange={(e) => setUser(e.target.value)}>
            {USERS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>
        <label>
          Status{" "}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat"><span>To do</span><strong>{stats.todo}</strong></div>
          <div className="stat"><span>In progress</span><strong>{stats.in_progress}</strong></div>
          <div className="stat"><span>Done</span><strong>{stats.done}</strong></div>
          <div className="stat overdue"><span>Overdue</span><strong>{stats.overdue}</strong></div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      <p className="meta">{tasks.length} tasks</p>

      <ul className="tasks">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onMarkDone={handleMarkDone} />
        ))}
      </ul>
    </div>
  );
}
