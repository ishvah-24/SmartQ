from django.shortcuts import render
from .models import *

# Create your views here.
def index(request):
    return render(request, "index.html")

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
        #department = request.POST.get('department')
        
        email = request.Post.get(signUpEmail)
        password = request.POST.get('signupPassword')
        password_confirm = request.POST.get('signUpPasswordConfirm')
        
        if(password != password_confirm):
            print("Passwords do not match, please try again.")
        else:        
            staff = Staff.objects.create(
                first_name = first_name, 
                last_name = last_name,
                email = staff_email
            )
            
            print(staff)
        
        

        