from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ProductListing, OrderTransaction


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'is_verified', 'location_region']
    list_filter = ['role', 'is_verified']
    fieldsets = UserAdmin.fieldsets + (
        ('NAEB Profile', {'fields': ('role', 'phone_number', 'location_region', 'is_verified')}),
    )


@admin.register(ProductListing)
class ProductListingAdmin(admin.ModelAdmin):
    list_display = ['crop_name', 'farmer', 'quantity_available', 'price_per_kg', 'is_active']
    list_filter = ['crop_category', 'quality_grade', 'is_active']


@admin.register(OrderTransaction)
class OrderTransactionAdmin(admin.ModelAdmin):
    list_display = ['contract_reference', 'buyer', 'product', 'total_amount', 'delivery_status']
    list_filter = ['delivery_status']