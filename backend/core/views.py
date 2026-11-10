from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction as db_transaction
from django.db.models import Sum, Count, Q

from .models import User, ProductListing, OrderTransaction
from .serializers import (UserSerializer, RegisterSerializer,
                          ProductListingSerializer, OrderTransactionSerializer)
from .permissions import IsAdminRole, IsFarmerOrAdmin


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Account created. Await NAEB verification."},
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        user = self.get_object()
        user.is_verified = True
        user.save()
        return Response({"detail": f"{user.username} verified."})


class ProductListingViewSet(viewsets.ModelViewSet):
    serializer_class = ProductListingSerializer
    queryset = ProductListing.objects.filter(is_active=True)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Farmers see only their own listings in management view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.role == 'FARMER':
                qs = qs.filter(farmer=user)
        # Buyers & admins see all active; filter by category if given
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(crop_category=category)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(crop_name__icontains=search) |
                           Q(location__icontains=search))
        return qs

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsFarmerOrAdmin])
    def my_listings(self, request):
        qs = ProductListing.objects.filter(farmer=request.user)
        return Response(self.get_serializer(qs, many=True).data)


class OrderTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = OrderTransactionSerializer
    queryset = OrderTransaction.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'BUYER':
            return qs.filter(buyer=user)
        if user.role == 'FARMER':
            return qs.filter(product__farmer=user)
        return qs  # admin sees all

    @action(detail=False, methods=['post'])
    def initiate_order(self, request):
        """Book appendix: secure order + atomic inventory deduction."""
        product_reference = request.data.get("product_id")
        product = None

        if product_reference is not None:
            product = ProductListing.objects.filter(id=product_reference, is_active=True).first()
            if not product:
                return Response({"detail": "A valid agricultural product is required."},
                                status=status.HTTP_400_BAD_REQUEST)

        try:
            requested_quantity = Decimal(str(request.data.get("quantity", 0) or 0))
        except (ValueError, TypeError):
            return Response({"detail": "Quantity must be numeric."},
                            status=status.HTTP_400_BAD_REQUEST)

        buyer = request.user

        # 2. Validate inventory
        if requested_quantity <= 0:
            return Response({"detail": "Requested quantity must be greater than zero."},
                            status=status.HTTP_400_BAD_REQUEST)
        if product.quantity_available < requested_quantity:
            return Response({"detail": "Insufficient stock available from this farmer."},
                            status=status.HTTP_406_NOT_ACCEPTABLE)

        total_price = requested_quantity * product.price_per_kg

        try:
            with db_transaction.atomic():
                order = OrderTransaction.objects.create(
                    buyer=buyer,
                    product=product,
                    quantity_ordered=requested_quantity,
                    total_amount=total_price,
                    delivery_status="Pending Transport",
                    delivery_address=request.data.get("delivery_address", ""),
                )
                product.quantity_available -= requested_quantity
                product.save(update_fields=['quantity_available'])

            return Response({
                "detail": "Order contract generated and inventory updated successfully.",
                "order": OrderTransactionSerializer(order).data,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": f"A database error occurred: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminRole])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('delivery_status')
        valid = [c[0] for c in OrderTransaction.STATUS_CHOICES]
        if new_status not in valid:
            return Response({"detail": "Invalid status."}, status=400)
        order.delivery_status = new_status
        order.save()
        return Response(OrderTransactionSerializer(order).data)


class DashboardStatsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_orders = OrderTransaction.objects.count()
        active_listings = ProductListing.objects.filter(is_active=True).count()
        total_volume = OrderTransaction.objects.aggregate(s=Sum('total_amount'))['s'] or 0
        pending_verifications = User.objects.filter(
            role__in=['FARMER', 'BUYER'], is_verified=False
        ).count()

        # Supply trends by category
        trends = list(
            ProductListing.objects.filter(is_active=True)
            .values('crop_category')
            .annotate(volume=Sum('quantity_available'))
            .order_by('crop_category')
        )

        # Recent pending verifications
        pending = list(
            User.objects.filter(role__in=['FARMER', 'BUYER'], is_verified=False)
            .order_by('-created_at')[:5]
            .values('id', 'username', 'role', 'created_at')
        )

        return Response({
            'total_orders': total_orders,
            'active_listings': active_listings,
            'total_volume': float(total_volume),
            'pending_verifications': pending_verifications,
            'trends': trends,
            'pending_users': pending,
        })


class ReportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        status_filter = request.query_params.get('status')
        category = request.query_params.get('category')

        qs = OrderTransaction.objects.select_related('product', 'buyer').all()
        if status_filter:
            qs = qs.filter(delivery_status=status_filter)
        if category:
            qs = qs.filter(product__crop_category=category)

        return Response({
            'count': qs.count(),
            'total_amount': float(qs.aggregate(s=Sum('total_amount'))['s'] or 0),
            'orders': OrderTransactionSerializer(qs, many=True).data,
        })