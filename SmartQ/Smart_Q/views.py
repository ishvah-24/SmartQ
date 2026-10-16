from django.shortcuts import render, redirect
from .models import *
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login

# Create your views here.
def index(request):
    return render(request, "index.html")

@login_required(login_url='index')
def dashboard(request):
    return render(request, "dashboard.html")

def analytics(request):
    return render(request, "analytics.html")

def student_create(request):
    print("VIEW WAS CALLED!!!!!!")
    
    if request.method == 'POST':
        student_number = request.POST.get('student_number')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        phone_number = request.POST.get('phone_number')
        query = request.POST.get('purpose')
        
        student = Student.objects.create(
            student_number = student_number, 
            first_name = first_name, 
            last_name = last_name, 
            phone_number = phone_number
        )
        
        category = ServiceCategory.objects.create(
            category_name = query                             
        )
        
        ticket = QueueTicket.objects.create(
            student=student, 
            category=category, 
            queue_status = "Waiting", 
            priority_level = "Normal Priority"
        )
        
        print(student, "\n", category, "\n", ticket)
        
#       return render(request, "index.html")
        return render(request, "index.html", {"ticket": ticket})

    return render(request, "index.html", {"ticket": ticket})

def staff_create(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        staff_email = request.POST.get('signUpEmail')

        staff = Staff.objects.create(
            first_name=first_name,
            last_name=last_name,
            staff_email=staff_email
        )

        print(staff)

        return render(request, "index.html")

    return render(request, "index.html")

def staff_signin(request):
    if request.method == 'POST':
        email = request.POST.get('loginEmail')
        password = request.POST.get('loginPassword')

        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            print("Invalid email or password")

    return render(request, "index.html")
        

@login_required(login_url='index')
def dashboard(request):

    queue_tickets = QueueTicket.objects.select_related(
        'student', 'category'
    ).order_by('-ticket_id')

    status_mapping = {
        'Waiting': 'waiting',
        'Called': 'in-progress',
        'In service': 'in-progress',
        'Completed': 'served',
        'No show': 'no-show',
    }

    tickets_data = []

    for ticket in queue_tickets:
        tickets_data.append({
            'ticketNumber': f'A-{ticket.ticket_id:03d}',
            'name': (
                f'{ticket.student.first_name} '
                f'{ticket.student.last_name}'
            ),
            'studentNumber': str(ticket.student.student_number),
            'phone': ticket.student.phone_number,
            'query': ticket.category.category_name,
            'status': status_mapping.get(
                ticket.queue_status, 'waiting'
            ),
            'submittedAt': ticket.date_created.isoformat(),
        })

    return render(request, 'dashboard.html', {
        'tickets_data': tickets_data
    })
        

        