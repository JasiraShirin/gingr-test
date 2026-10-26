# Notes

## Bugs fixed
- **Anyone could edit any task** (`tasks/permissions.py`): the check was `obj.assigned_to or obj.created_by == request.user`. A model instance is always truthy, so the `or` short-circuited to `True` for every user. Fixed by comparing both fields with `request.user`.
- **The assignee could delete a task** (`tasks/permissions.py`): DELETE used the same rule as edit, but only the creator may delete. Added a DELETE check that returns `obj.created_by == request.user` before the edit rule.
- **The client could set or change the creator** (`tasks/views.py`, `tasks/serializers.py`): `perform_create` used `created_by` from the request body, and the field was writable on update. This also undermined the delete rule. The creator is now always saved as `request.user`, and `created_by` is read-only in the serializer.
- **Tasks with no due date came first** (`tasks/views.py`): `order_by("due_date")` leaves NULL placement to the database, and SQLite puts NULLs first. Changed to `F("due_date").asc(nulls_last=True)`.

## Bugs found but not fixed (time)
- **Status filter ignored** (`tasks/views.py`): the backend reads the `state` query param, but the frontend sends `status`.
- **N+1 queries on the list** (`tasks/views.py`): the assignee and creator names load one query per task. Fix: `select_related("assigned_to", "created_by")`.
- **Overdue badge inaccurate** (`tasks/serializers.py`): it compares dates only, using naive `datetime.utcnow()`, so a task due earlier today is not overdue and the day boundary is in UTC, not local time. Fix: `obj.due_date < timezone.now()`.
- **Filter change doesn't reload the list** (`App.jsx`): `status` is missing from the `useEffect` dependency array.
- **"Mark done" doesn't re-render** (`App.jsx`): the task object is mutated and the same array is passed to `setTasks`, so React sees no change. Fix: `setTasks(prev => prev.map(...))` with a new object.
- **Count shows one page only** (`App.jsx`): uses `tasks.length` (max 20 per page) instead of the API's total `data.count`.

## Feature: task stats
- `GET /api/tasks/stats/` returns `{"todo", "in_progress", "done", "overdue"}` for tasks assigned to the logged-in user. It is a `@action(detail=False)` on `TaskViewSet`, so no URL changes were needed.
- **One database query:** all four counts come from a single `aggregate()` with conditional `Count("id", filter=Q(...))`. Overdue is `due_date < now AND status != done`, so done tasks and tasks with no due date are never overdue. With Basic auth, the login adds one user lookup.
- **Tests** (`tasks/tests.py`): exact counts for the current user only, including a done-but-late task and another user's task; `assertNumQueries(1)`; and 401 without login.
- **Frontend:** a summary bar above the list. It reloads when the user switches and after "Mark done".

## Improvements with more time
- Fix the remaining bugs above, then add tests for permissions, filtering, sorting and the overdue rule.
- Put the overdue rule in one place (a model method or queryset) so the badge and the stats can never disagree.
- Replace the hardcoded demo password and Basic auth with token or session login.
- Add frontend tests and a loading state for the list and stats.
- Add a database index on `(assigned_to, status)` and on `due_date` as the data grows.

## Tradeoffs / assumptions
- After "Mark done", the stats are reloaded from the server rather than adjusted in the browser. This costs one small request but keeps the server as the single source of truth.
- "Overdue" means past the exact due time, not past the due day.
- The stats count all of the user's assigned tasks and ignore the status filter, since the bar is a summary of the user's workload.
- Bugs were prioritised by impact: security and permission bugs first, because they affect data integrity.

## Use of AI
- AI helped most with reading the codebase quickly, spotting the bugs, and explaining root causes. I checked each fix by running the tests and calling the API in the browser.
- It got things wrong at times. It quoted a line number that was off by one after an import was added, and the setup advice did not account for the project being inside a OneDrive folder. That folder caused a broken Django install.
