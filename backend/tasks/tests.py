from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Task


class TaskApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.alice = User.objects.create_user("alice", password="password123")
        self.bob = User.objects.create_user("bob", password="password123")
        Task.objects.create(
            title="Sample", assigned_to=self.alice, created_by=self.alice,
            due_date=timezone.now(),
        )

    def test_list_requires_auth(self):
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 401)

    def test_list_tasks(self):
        self.client.force_authenticate(self.alice)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)


class TaskStatsTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.alice = User.objects.create_user("alice", password="password123")
        self.bob = User.objects.create_user("bob", password="password123")
        yesterday = timezone.now() - timedelta(days=1)
        tomorrow = timezone.now() + timedelta(days=1)

        def make(status, due_date, assignee):
            Task.objects.create(
                title=status, status=status, due_date=due_date,
                assigned_to=assignee, created_by=self.bob,
            )

        make("todo", None, self.alice)              # todo, no due date: not overdue
        make("todo", tomorrow, self.alice)          # todo, due in future: not overdue
        make("in_progress", yesterday, self.alice)  # past due and not done: overdue
        make("done", yesterday, self.alice)         # past due but done: NOT overdue
        make("todo", yesterday, self.bob)           # bob's task: must not be counted

    def test_stats_counts_only_current_users_tasks(self):
        self.client.force_authenticate(self.alice)
        response = self.client.get("/api/tasks/stats/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data, {"todo": 2, "in_progress": 1, "done": 1, "overdue": 1}
        )

    def test_stats_uses_one_query(self):
        self.client.force_authenticate(self.alice)
        with self.assertNumQueries(1):
            self.client.get("/api/tasks/stats/")

    def test_stats_requires_auth(self):
        response = self.client.get("/api/tasks/stats/")
        self.assertEqual(response.status_code, 401)
