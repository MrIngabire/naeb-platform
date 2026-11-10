from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


class User(AbstractUser):
    """Custom user with roles per book: NAEB Admin, Farmer, Buyer."""
    ROLE_CHOICES = (
        ('ADMIN', 'NAEB Administrator'),
        ('FARMER', 'Farmer / Cooperative'),
        ('BUYER', 'Buyer (Wholesaler/Exporter)'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='BUYER')
    phone_number = models.CharField(max_length=20, blank=True)
    location_region = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class ProductListing(models.Model):
    CROP_CHOICES = (
        ('coffee', 'Coffee'),
        ('tea', 'Tea'),
        ('horticulture', 'Horticulture'),
        ('pyrethrum', 'Pyrethrum'),
    )
    QUALITY_CHOICES = (
        ('A', 'Grade A'),
        ('B', 'Grade B'),
        ('C', 'Grade C'),
    )
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    crop_name = models.CharField(max_length=100)
    crop_category = models.CharField(max_length=20, choices=CROP_CHOICES, default='coffee')
    quantity_available = models.DecimalField(max_digits=12, decimal_places=2,
                                             validators=[MinValueValidator(0)])
    price_per_kg = models.DecimalField(max_digits=12, decimal_places=2,
                                       validators=[MinValueValidator(0)])
    quality_grade = models.CharField(max_length=2, choices=QUALITY_CHOICES, default='A')
    location = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.crop_name} - {self.farmer.username}"


class OrderTransaction(models.Model):
    STATUS_CHOICES = (
        ('Pending Transport', 'Pending Transport'),
        ('In Transit', 'In Transit'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    )
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    product = models.ForeignKey(ProductListing, on_delete=models.PROTECT, related_name='orders')
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    delivery_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending Transport')
    delivery_address = models.CharField(max_length=255, blank=True)
    contract_reference = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.contract_reference:
            import uuid
            self.contract_reference = f"ORD-{self.created_at.year if self.created_at else 2026}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.contract_reference