from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^tweet/', views.gettweet, name='gettweet'),
    url(r'^$', views.home, name='home'),
]