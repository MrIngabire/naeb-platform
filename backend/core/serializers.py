from rest_framework import serializers
from .models import User, ProductListing, OrderTransaction


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone_number', 'location_region', 'is_verified']
        read_only_fields = ['id', 'is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name',
                  'role', 'phone_number', 'location_region']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        # Farmers and buyers need admin verification
        user.is_verified = (user.role == 'ADMIN')
        user.save()
        return user


class ProductListingSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.username', read_only=True)
    farmer_id = serializers.IntegerField(source='farmer.id', read_only=True)

    class Meta:
        model = ProductListing
        fields = ['id', 'farmer', 'farmer_id', 'farmer_name', 'crop_name',
                  'crop_category', 'quantity_available', 'price_per_kg',
                  'quality_grade', 'location', 'image_url', 'is_active',
                  'created_at', 'updated_at']
        read_only_fields = ['farmer', 'created_at', 'updated_at']


class OrderTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.crop_name', read_only=True)
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    farmer_name = serializers.CharField(source='product.farmer.username', read_only=True)

    class Meta:
        model = OrderTransaction
        fields = ['id', 'buyer', 'buyer_name', 'product', 'product_name',
                  'farmer_name', 'quantity_ordered', 'total_amount',
                  'delivery_status', 'delivery_address', 'contract_reference',
                  'created_at', 'updated_at']
        read_only_fields = ['buyer', 'total_amount', 'contract_reference',
                            'created_at', 'updated_at']