import bcrypt
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
import json

from grad_web.models import *


def sign_up(request):
    if request.method == "GET":
        return render(request, "places/signup.html")
    elif request.method == "POST":
        data = request.POST
        try:
            if Account.objects.filter(email=data['email']).exists():
                return render(request, "places/signup.html", {'error': '이미 가입된 이메일입니다.'})
            hashed_password = bcrypt.hashpw(
                data['password'].encode('utf-8'), bcrypt.gensalt())
            Account.objects.create(
                email=data['email'],
                password=hashed_password.decode('utf-8'),
            )
            account_data = Account.objects.get(email=data['email'])
            request.session['sessionKey'] = account_data.id
            return render(request, "places/rating.html", {'email': data['email']})

        except KeyError as ke:
            print(ke.args)
            return render(request, 'places/signup.html', {'error': "Error"})

        # return render(request, "places/map.html")


def sign_in(request):
    if request.method == "GET":
        return render(request, "places/login.html")
    elif request.method == "POST":
        data = request.POST

        try:
            if Account.objects.filter(email=data['email']).exists():
                user = Account.objects.get(email=data['email'])

                if bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
                    account_data = Account.objects.get(email=data['email'])
                    request.session['sessionKey'] = account_data.id
                    try:
                        if data['find']:
                            return render(request, 'places/rating.html', {'email': data['email']})
                    except KeyError:
                        return render(request, "places/map.html", {'email': data['email']})
            return render(request, 'places/login.html', {'error': "해당 이메일로 가입된 계정이 없거나 비밀번호 오류입니다."})

        except KeyError:
            return render(request, 'places/login.html', {'error': "Error"})
