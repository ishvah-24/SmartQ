"""
URL configuration for SmartQ project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from Smart_Q import views
from django.views.generic import TemplateView


urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('', views.index, name="index"), 
    path('dashboard/', views.dashboard, name="dashboard"), 
    path('tickets/update-status/', views.update_ticket_status, name='update_ticket_status'),
    path("analytics/", views.analytics, name="analytics"),
    path('student-create/', views.student_create, name="student_create"),
    path('staff/create/', views.staff_create, name='staff_create'),
    path('staff/signin/', views.staff_signin, name='staff_signin'),
    path('staff/logout/', views.staff_logout, name='staff_logout'),
    
    path('test-400/', TemplateView.as_view(template_name='errors/400.html')),
    path('test-403/', TemplateView.as_view(template_name='errors/403.html')),
    path('test-404/', TemplateView.as_view(template_name='errors/404.html')),
    path('test-500/', TemplateView.as_view(template_name='errors/500.html')),
]


#error pages
handler403 = 'Smart_Q.views.permission_denied'
handler404 = 'Smart_Q.views.page_not_found'
handler500 = 'Smart_Q.views.server_error'
