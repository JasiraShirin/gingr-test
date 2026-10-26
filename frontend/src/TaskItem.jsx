export default function TaskItem({ task, onMarkDone }) {
  return (
    <li className="task">
      <div>
        <strong>{task.title}</strong>
        <div className="meta">
          {task.assigned_to_name} · due{" "}
          {task.due_date ? new Date(task.due_date).toLocaleString() : "—"}
        </div>
      </div>
      <div className="right">
        {task.is_overdue && <span className="badge overdue">Overdue</span>}
        <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span>
        {task.status !== "done" && (
          <button onClick={() => onMarkDone(task)}>Mark done</button>
        )}
      </div>
    </li>
  );
}
