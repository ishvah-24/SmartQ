
import json

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError

from .models import Student, Staff, ServiceCategory, QueueTicket
from .notifications import send_ticket_notification


def index(request):
    return redirect("student_queue")


def student_queue(request):
    return render(request, "student_queue.html")


def staff_page(request):
    return render(request, "staff.html")


@require_POST
def student_create(request):
    student_number = request.POST.get("student_number")
    first_name = request.POST.get("first_name")
    last_name = request.POST.get("last_name")
    phone_number = request.POST.get("phone_number")
    query = request.POST.get("purpose")

    if not all([
        student_number,
        first_name,
        last_name,
        phone_number,
        query
    ]):
        return render(request, "student_queue.html", {
            "student_error": "Please complete all fields."
        })

    if not student_number.isdigit():
        return render(request, "student_queue.html", {
            "student_error": "Invalid student number."
        })

    with transaction.atomic():
        student, created = Student.objects.get_or_create(
            student_number=int(student_number),
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "phone_number": phone_number
            }
        )

        student = Student.objects.select_for_update().get(
            pk=student.pk
        )

        existing_ticket = QueueTicket.objects.filter(
            student=student,
            queue_status__in=[
                "Waiting",
                "Called",
                "In service"
            ]
        ).order_by("-ticket_id").first()

        if existing_ticket:
            request.session["student_ticket_id"] = (
                existing_ticket.ticket_id
            )

            return render(request, "student_queue.html", {
                "ticket": existing_ticket
            })

        category = ServiceCategory.objects.filter(
            category_name=query
        ).order_by("category_id").first()

        if category is None:
            category = ServiceCategory.objects.create(
                category_name=query
            )

        ticket = QueueTicket.objects.create(
            student=student,
            category=category,
            queue_status="Waiting",
            priority_level="Normal Priority",
            joined_time=timezone.now()
        )

        request.session["student_ticket_id"] = ticket.ticket_id

    send_ticket_notification(ticket, "Waiting")

    print(f"Ticket A-{ticket.ticket_id:03d} created successfully")

    return render(request, "student_queue.html", {
        "ticket": ticket
    })



@require_POST
def student_cancel_ticket(request, ticket_id):
    session_ticket_id = request.session.get("student_ticket_id")

    if session_ticket_id is None:
        return HttpResponseForbidden(
            "Your session has expired or no ticket is associated with this session."
        )

    if str(session_ticket_id) != str(ticket_id):
        return HttpResponseForbidden(
            "You are not authorised to cancel this ticket."
        )

    with transaction.atomic():
        ticket = get_object_or_404(
            QueueTicket.objects.select_for_update(),
            ticket_id=ticket_id
        )

        if ticket.queue_status != "Waiting":
            return redirect("student_queue")

        ticket.queue_status = "Cancelled"
        ticket.status_changed_at = timezone.now()

        ticket.save(
            update_fields=[
                "queue_status",
                "status_changed_at"
            ]
        )

    request.session.pop("student_ticket_id", None)

    print(f"Ticket A-{ticket.ticket_id:03d} cancelled")

    return redirect("student_queue")



@require_POST
def staff_create(request):
    print("STAFF CREATE CALLED")

    first_name = request.POST.get("first_name", "").strip()
    last_name = request.POST.get("last_name", "").strip()
    staff_email = request.POST.get("signUpEmail", "").strip().lower()

    password = request.POST.get("signUpPassword", "")
    confirm_password = request.POST.get("signUpPasswordConfirm", "")

    print("Received fields:", list(request.POST.keys()))
    print("Email:", staff_email)

    if not all([
        first_name,
        last_name,
        staff_email,
        password,
        confirm_password
    ]):
        return render(request, "staff.html", {
            "signup_error": "Please complete all fields."
        })

    if password != confirm_password:
        return render(request, "staff.html", {
            "signup_error": "Passwords do not match."
        })

    User = get_user_model()

    if (
        User.objects.filter(username__iexact=staff_email).exists()
        or Staff.objects.filter(staff_email__iexact=staff_email).exists()
    ):
        return render(request, "staff.html", {
            "signup_error": "An account with this email already exists."
        })

    try:
        validate_password(password)

    except ValidationError as error:
        return render(request, "staff.html", {
            "signup_error": " ".join(error.messages)
        })

    try:
        print("ATTEMPTING DATABASE INSERT")

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

            print("Django user created:", user.id)

            staff = Staff.objects.create(
                user=user,
                first_name=first_name,
                last_name=last_name,
                staff_email=staff_email
            )

            print("Staff profile created:", staff.staff_id)

    except IntegrityError as error:
        print("FAILED: Database integrity error:", repr(error))

        return render(request, "staff.html", {
            "signup_error": (
                "Unable to create an account. "
                "Please check the server logs."
            )
        })

    print("SUCCESS: Staff account created:", staff.staff_email)

    return render(request, "staff.html", {
        "signup_success": (
            "Account created successfully. Please sign in."
        )
    })


def staff_signin(request):
    if request.method == "POST":
        email = request.POST.get("loginEmail", "").strip().lower()
        password = request.POST.get("loginPassword", "")

        User = get_user_model()

        if not email or not password:
            return render(request, "staff.html", {
                "login_error": "Please enter your email and password."
            })

        user_exists = User.objects.filter(
            username__iexact=email
        ).first()

        if not user_exists:
            return render(request, "staff.html", {
                "login_error": "No account found with this email address."
            })

        if not user_exists.is_active:
            return render(request, "staff.html", {
                "login_error": "This account has already been disabled."
            })

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is None:
            return render(request, "staff.html", {
                "login_error": "Incorrect password. Please try again."
            })

        if not Staff.objects.filter(user=user).exists():
            return render(request, "staff.html", {
                "login_error": (
                    "This account is not registered as reception staff."
                )
            })

        login(request, user)

        return redirect("dashboard")

    return redirect("staff_page")


@login_required(login_url="staff_page")
@require_POST
def staff_logout(request):
    logout(request)
    return redirect("staff_page")


def get_dashboard_tickets():
    queue_tickets = QueueTicket.objects.select_related(
        "student", "category"
    ).order_by("-ticket_id")

    status_mapping = {
        "Waiting": "waiting",
        "Called": "called",
        "In service": "in-progress",
        "Completed": "served",
        "No show": "no-show",
        "Cancelled": "cancelled"
    }

    tickets_data = []

    for ticket in queue_tickets:
        waiting_minutes = None

        if ticket.joined_time and ticket.called_time:
            waiting_seconds = (
                ticket.called_time - ticket.joined_time
            ).total_seconds()

            waiting_minutes = max(
                0,
                round(waiting_seconds / 60)
            )

        tickets_data.append({
            "id": ticket.ticket_id,
            "ticketNumber": f"A-{ticket.ticket_id:03d}",
            "name": (
                f"{ticket.student.first_name} "
                f"{ticket.student.last_name}"
            ),
            "studentNumber": str(ticket.student.student_number),
            "phone": ticket.student.phone_number,
            "query": ticket.category.category_name,
            "status": status_mapping.get(
                ticket.queue_status, "unknown"
            ),
            "submittedAt": ticket.date_created.isoformat(),
            "waitingMinutes": waiting_minutes,
            "statusChangedAt": (
                ticket.status_changed_at.isoformat()
                if ticket.status_changed_at else None
            )
        })

    return tickets_data


@login_required(login_url="staff_page")
def dashboard(request):
    return render(request, "dashboard.html", {
        "tickets_data": get_dashboard_tickets()
    })


@login_required(login_url="staff_page")
def dashboard_ticket_data(request):
    return JsonResponse({
        "tickets": get_dashboard_tickets()
    })


@login_required(login_url="staff_page")
@require_POST
def update_ticket_status(request):
    try:
        data = json.loads(request.body)
        ticket_id = data.get("ticket_id")

        status_transitions = {
            "Waiting": "Called",
            "Called": "In service",
            "In service": "Completed"
        }

        with transaction.atomic():
            ticket = QueueTicket.objects.select_for_update().get(
                ticket_id=ticket_id
            )

            if ticket.queue_status not in status_transitions:
                return JsonResponse({
                    "success": False,
                    "error": "This ticket cannot be advanced."
                }, status=400)

            previous_status = ticket.queue_status
            now = timezone.now()

            ticket.queue_status = status_transitions[previous_status]
            ticket.status_changed_at = now

            update_fields = [
                "queue_status",
                "status_changed_at"
            ]

            if previous_status == "Waiting":
                ticket.called_time = now
                update_fields.append("called_time")

            ticket.save(update_fields=update_fields)

        send_ticket_notification(ticket, ticket.queue_status)

        return JsonResponse({
            "success": True,
            "ticket_id": ticket.ticket_id,
            "new_status": ticket.queue_status,
            "status_changed_at": ticket.status_changed_at.isoformat()
        })

    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({
            "success": False,
            "error": "Invalid request data."
        }, status=400)

    except QueueTicket.DoesNotExist:
        return JsonResponse({
            "success": False,
            "error": "Ticket not found."
        }, status=404)


@login_required(login_url="staff_page")
def analytics(request):
    tickets = (
        QueueTicket.objects
        .select_related("student", "category")
        .order_by("ticket_id")
    )

    analytics_data = []

    for ticket in tickets:
        analytics_data.append({
            "id": ticket.ticket_id,
            "status": ticket.queue_status,
            "category": ticket.category.category_name,
            "date": ticket.date_created.isoformat(),

            "submittedAt": (
                ticket.joined_time.isoformat()
                if ticket.joined_time else None
            ),

            "calledAt": (
                ticket.called_time.isoformat()
                if ticket.called_time else None
            ),

            "statusChangedAt": (
                ticket.status_changed_at.isoformat()
                if ticket.status_changed_at else None
            ),

            "serviceStartedAt": (
                ticket.called_time.isoformat()
                if ticket.called_time else None
            ),

            "completedAt": (
                ticket.status_changed_at.isoformat()
                if ticket.queue_status == "Completed"
                and ticket.status_changed_at else None
            )
        })

    return render(request, "analytics.html", {
        "analytics_data": analytics_data
    })


def permission_denied(request, exception):
    return render(request, "errors/403.html", status=403)


def page_not_found(request, exception):
    return render(request, "errors/404.html", status=404)


def server_error(request):
    return render(request, "errors/500.html", status=500)


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

