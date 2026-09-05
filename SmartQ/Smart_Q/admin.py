from django.contrib import admin
from .models import Student, Staff, ServiceCategory, Counter, QueueTicket, Notification

# Register your models here.
admin.site.register(Student)
admin.site.register(Staff)
admin.site.register(ServiceCategory)
admin.site.register(Counter)
admin.site.register(QueueTicket) 
admin.site.register(Notification) 

# The reason for registering models in admin is for the superuser 
# of the project to have access to the tables in order to create test objects (students, 
# tickets and notifications) 
# it is accessible through using a superuser 
# PURELY FOR TESTING PURPOSES