from django.core import serializers
from django.db.models import F
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
import json

from grad_web.models import *


def save_rating(request):
    try:
        data = request.GET
        custid = Account.objects.get(email__exact=str(data['email'])).id
        restid = data['restid']
        rating = data['value']
        if Rating.objects.filter(custid=custid, restid=restid).exists():
            rating_row = Rating.objects.get(custid=custid, restid=restid)
            rating_row.rating = rating
            rating_row.save()
        else:
            rating_row = Rating(custid=custid, restid=int(restid), rating=int(rating))
            rating_row.save()
    except Exception as e:
        print(e.args)
        return HttpResponse(status=500)
    return HttpResponse(status=200)


def search(request, name: str):
    obj = Rest.objects.filter(name__icontains=name).annotate(
        fieldsum=F('blogCafeReviewCount') + F('bookingReviewCount')).order_by('-fieldsum')[:100]
    result = serializers.serialize("json", obj)

    return HttpResponse(result, content_type='application/json')
