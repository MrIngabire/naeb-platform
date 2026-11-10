from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (RegisterView, MeView, UserViewSet, ProductListingViewSet,
                    OrderTransactionViewSet, DashboardStatsView, ReportView)

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('listings', ProductListingViewSet, basename='listing')
router.register('orders', OrderTransactionViewSet, basename='order')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('reports/', ReportView.as_view(), name='reports'),
    path('', include(router.urls)),
]