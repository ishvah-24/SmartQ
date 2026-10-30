import json
from django.shortcuts import render, redirect
from .models import *
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from .notifications import send_ticket_notification
from django.core.exceptions import BadRequest
from django.core.exceptions import PermissionDenied



def index(request):
    return render(request, "index.html")


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
        
        student, created = Student.objects.get_or_create(
            student_number=student_number,
            defaults={
            'first_name' : first_name, 
            'last_name' : last_name, 
            'phone_number' : phone_number
                'first_name': first_name,
                'last_name': last_name,
                'phone_number': phone_number
            }
        )
        
        category = ServiceCategory.objects.filter(
            category_name=query
        ).first()

        if category is None:
            category = ServiceCategory.objects.create(
                category_name=query
            )
            
        ticket = QueueTicket.objects.create(
            student=student, 
            category=category, 
            queue_status = "Waiting", 
            priority_level = "Normal Priority", 
            joined_time=timezone.now()

        )
        send_ticket_notification(ticket, "Waiting")
        
        print(student, "\n", category, "\n", ticket)
        
#       return render(request, "index.html")
        return render(request, "index.html", {"ticket": ticket})

    return render(request, "index.html")



def staff_create(request):

    if request.method == 'POST':

        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        staff_email = request.POST.get('signUpEmail', '').strip().lower()

        password = request.POST.get('signUpPassword', '')
        confirm_password = request.POST.get('signUpPasswordConfirm', '')

        if not all([first_name, last_name, staff_email, password, confirm_password]):
            return render(request, "index.html", {
                "signup_error": "Please complete all fields."
            })

        # password validation
        if password != confirm_password:
            return render(request, "index.html", {
                "signup_error": "Passwords do not match."
            })

        User = get_user_model()


        if (
            User.objects.filter(username__iexact=staff_email).exists()
            or Staff.objects.filter(staff_email__iexact=staff_email).exists()
        ):
            return render(request, "index.html", {
                "signup_error": "An account with this email already exists."
            })

        try:
            validate_password(password)
        except ValidationError as error:
            return render(request, "index.html", {
                "signup_error": " ".join(error.messages)
            })

        try:
            with transaction.atomic():

                user = User.objects.create_user(
                    username=staff_email,
                    email=staff_email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_staff=False,
                    is_superuser=False
                )

                staff = Staff.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                    staff_email=staff_email
                )

        except IntegrityError:
            return render(request, "index.html", {
                "signup_error": "Unable to create an account. This email may already be registered."
            })

        print("Staff account created:", staff.staff_email)

        return render(request, "index.html", {
            "signup_success": "Account created successfully. Please sign in."
        })

    return render(request, "index.html")


def staff_signin(request):
    if request.method == 'POST':
        email = request.POST.get('loginEmail')
        password = request.POST.get('loginPassword')

        user = authenticate(request, 
                            username=email, 
                            password=password
                            )

        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            return render(request, "index.html", {
                "login_error": "Invalid email or password."
            })

        return redirect('index')

@login_required(login_url='index')
@require_POST
def staff_logout(request):
    logout(request)
    return redirect('index')

@login_required(login_url='index')
def dashboard(request):

    queue_tickets = QueueTicket.objects.select_related(
        'student', 'category'
    ).order_by('-ticket_id')

    status_mapping = {
        'Waiting': 'waiting',
        'Called': 'called',
        'In service': 'in-progress',
        'Completed': 'served',
        'No show': 'no-show',
    }

    tickets_data = []

    for ticket in queue_tickets:
        waiting_minutes=None
        
        if ticket.joined_time and ticket.called_time:
            waiting_seconds = (
                ticket.called_time - ticket.joined_time
            ).total_seconds()
            
            waiting_minutes = max(0, round(waiting_seconds / 60))
            print(f"Ticket {ticket.ticket_id}: Waiting time = {waiting_minutes} minutes")
            
        
        tickets_data.append({
        'id': ticket.ticket_id,
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
        'waitingMinutes': waiting_minutes,
        'statusChangedAt': ticket.status_changed_at.isoformat(),
    })

    return render(request, 'dashboard.html', {
        'tickets_data': tickets_data
    })
        
@login_required(login_url='index')
@require_POST
def update_ticket_status(request):

    try:
        data = json.loads(request.body)

        ticket_id = data.get('ticket_id')

        ticket = QueueTicket.objects.get(ticket_id=ticket_id)

        status_transitions = {
            'Waiting': 'Called',
            'Called': 'In service',
            'In service': 'Completed'
        }

        if ticket.queue_status not in status_transitions:
            return JsonResponse({
                'success': False,
                'error': 'This ticket cannot be advanced.'
            }, status=400)

        previous_status = ticket.queue_status
        
        now = timezone.now()

        ticket.queue_status = status_transitions[previous_status]
        ticket.status_changed_at = now

        update_fields = ['queue_status', 'status_changed_at']

        if previous_status == 'Waiting':
            ticket.called_time = now
            update_fields.append('called_time')

        ticket.save(update_fields=update_fields)

        send_ticket_notification(ticket, ticket.queue_status)
        return JsonResponse({
            'success': True,
            'ticket_id': ticket.ticket_id,
            'new_status': ticket.queue_status,
            'status_changed_at': ticket.status_changed_at.isoformat()
        })

    except (ValueError, TypeError):
        return JsonResponse({
            'success': False,
            'error': 'Invalid request data.'
        }, status=400)

    except QueueTicket.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Ticket not found.'
        }, status=404)
        
        
        
def permission_denied(request, exception):
    return render(request, 'errors/403.html', status=403)


def page_not_found(request, exception):
    return render(request, 'errors/404.html', status=404)


def server_error(request):
    return render(request, 'errors/500.html', status=500)

def server_error(request):
    return render(request, '500.html', status=500)
        
def error_400(request, exception):
    return render(request, "errors/400.html", status=400)

def error_403(request, exception):
    return render(request, "errors/403.html", status=403)

def error_404(request, exception):
    return render(request, "errors/404.html", status=404)

def error_500(request):
    return render(request, "errors/500.html", status=500)

def csrf_failure(request, reason=""):
    return render(request, "errors/403.html", status=403)
