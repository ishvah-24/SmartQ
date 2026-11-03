
from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView
from Smart_Q import views

urlpatterns = [
    path("admin/", admin.site.urls),

    path("", views.index, name="index"),

    path("student-queue/", views.student_queue, name="student_queue"),
    path("student-create/", views.student_create, name="student_create"),
    path("student/cancel/<int:ticket_id>/", views.student_cancel_ticket, name="student_cancel_ticket"),

    path("staff-signin/", views.staff_page, name="staff_page"),
    path("staff-login/", views.staff_signin, name="staff_signin"),
    path("staff-create/", views.staff_create, name="staff_create"),
    path("staff/logout/", views.staff_logout, name="staff_logout"),

    path("dashboard/", views.dashboard, name="dashboard"),
    path("dashboard/tickets/", views.dashboard_ticket_data, name="dashboard_ticket_data"),
    path("tickets/update-status/", views.update_ticket_status, name="update_ticket_status"),
    path("analytics/", views.analytics, name="analytics"),

    path("test-400/", TemplateView.as_view(template_name="errors/400.html")),
    path("test-403/", TemplateView.as_view(template_name="errors/403.html")),
    path("test-404/", TemplateView.as_view(template_name="errors/404.html")),
    path("test-500/", TemplateView.as_view(template_name="errors/500.html")),
]

handler403 = "Smart_Q.views.permission_denied"
handler404 = "Smart_Q.views.page_not_found"
handler500 = "Smart_Q.views.server_error"
