# This files purpose is to handle all queue logic that a staff and student would have to use


from django.utils import timezone # needed for datetime functionality in queue ticketing
from django.db import transaction

from .models import (
    Student, 
    QueueTicket, 
    ServiceCategory, 
    Staff, 
    Notification, 
    Counter
)

# importing tables so that they can be used to create objects 
def join_queue(student_number, category_id):
    
    try:
        student = Student.objects.get(student_number = student_number)
    except Student.DoesNotExist: 
        return "Student does not Exist"
    
    try:
        service_category = ServiceCategory.objects.get(category_id=category_id)
    except ServiceCategory.DoesNotExist:
        return "Category does not exist"
    
    
    # check if student already has a ticket 
    # the variable: 'student__student_number' is due to Student being a Foreign Key to QueueTicket 
    # student'__'student_number is to allow the attributes from Student to be accessed via QueueTicket
    
    has_ticket = QueueTicket.objects.filter(student__student_number = student_number, queue_status="Waiting")
    
    if has_ticket:
        return f"{student_number} has already been issued a ticket"
    else:
    
        ticket = QueueTicket.objects.create(
            student = student, 
            category = service_category,  
            queue_status = "Waiting", 
            priority_level = "Normal Priority"
        )
        ticket.save()
        
        return ticket.ticket_id, get_position(ticket)
    

def get_position(ticket):
    ticket = QueueTicket.objects.get()
    
    position = Ticket.objects.filter(
        category = my_ticket.category, 
        status="Waiting", 
        date_created__lt = my_ticket.date_created
    ).count() + 1
    

def get_next_ticket():
    next_ticket = Ticket.objects.filter(status="Waiting").order_by("date_created").first()

def mark_served(ticket):
    pass
    
def skip_ticket(ticket):
    pass

def calculate_estimated_wait(ticket):
    pass    

