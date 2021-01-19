"""recommend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from grad_web.views import SignView, MainView, OtherView

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('', SignView.sign_in),
    path('signin/', SignView.sign_in),
    path('signup/', SignView.sign_up),
    path('find/', MainView.places_list),
    path("pos/", MainView.json_list),
    path('search/<str:name>', OtherView.search),
    path('rating/', OtherView.save_rating)
]
