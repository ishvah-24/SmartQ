from django.db import models

# Create your models here.
class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    student_number = models.IntegerField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=15)

    def __str__(self):
        return (f"{self.student_number} - {self.first_name} - {self.last_name}")
    
class Staff(models.Model):
    staff_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    department = models.CharField(max_length=50, null=True)

    def __str__(self):
        return (f"{self.first_name} - {self.last_name} - {self.department}")

class ServiceCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=50)
    description = models.TextField(null=True)

    def __str__(self):
        return (f"{self.category_id} - {self.description}")

class Counter(models.Model):
    counter_id = models.AutoField(primary_key=True)
    counter_number = models.IntegerField(null=True)

    def __str__(self):
        return (f"{self.counter_number}")

class QueueTicket(models.Model):
    
    QUEUE_STATUS = (
        ('Waiting', 'Waiting'),
        ('Called', 'Called'),
        ('In service', 'In service'),
        ('Completed', 'Completed'),
        ('No show', 'No show'),
    )

    PRIORITY_LEVEL = (
        ('High Priority', 'High Priority'),
        ('Normal Priority', 'Normal Priority'),
    )
    
    ticket_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, null=True)
    counter = models.ForeignKey(Counter, on_delete=models.CASCADE, null=True)
    date_created = models.DateField(auto_now_add=True)
    called_time = models.DateTimeField(null=True, blank=True)
    
    queue_status = models.CharField(max_length=50, 
                                    choices=QUEUE_STATUS, 
                                    default="High Priority"
                                    )
    
    priority_level = models.CharField(max_length=50, 
                                      choices=PRIORITY_LEVEL, 
                                      default="No show"
                                      )
    def __str__(self):
        return (f"{self.ticket_id} - {self.student} - {self.category.description} - {self.staff} - {self.queue_status}")
    
class Notification(models.Model):
    notification_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    ticket = models.ForeignKey(QueueTicket, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50, null=True)
    date_sent = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return (f"{self.notification_id} - {self.student.student_number} - {self.date_sent}")