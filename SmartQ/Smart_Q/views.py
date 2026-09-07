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
        
        Student.objects.create(
            student_number = student_number, 
            first_name = first_name, 
            last_name = last_name, 
            phone_number = phone_number
        )
                
        print(student_number)
        print(first_name)
        print(last_name)
        print(phone_number)
        #print(query)
        
        return render(request, "Smart_Q/index.html")

def staff_create(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        department = request.POST.get('department3')
        
        Staff.objects.create(
            first_name = first_name, 
            last_name = last_name, 
            department = department
        )
        
        

        