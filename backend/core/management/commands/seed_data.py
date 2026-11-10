"""
Large seed dataset for NAEB Farm-to-Market platform.

Creates:
  - 1 NAEB admin
  - 12 farmers / cooperatives (10 verified, 2 pending)
  - 47 buyers (40 verified, 7 pending)
  - ~150 product listings across 4 crop categories
  - ~400 orders spread over the last 90 days with varied statuses

Usage:
    python manage.py seed_data              # default size
    python manage.py seed_data --flush      # wipe existing and reseed
"""

import random
import uuid
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import User, ProductListing, OrderTransaction


# ---------------------------------------------------------------------------
# Data pools
# ---------------------------------------------------------------------------

FARMER_NAMES = [
    ("gicumbi_coop", "Gicumbi Coffee Cooperative", "Gicumbi District"),
    ("maraba_coop", "Maraba Coffee Cooperative", "Huye District"),
    ("rubavu_tea", "Rubavu Tea Estate", "Rubavu District"),
    ("nyabihu_hort", "Nyabihu Horticulture Farmers", "Nyabihu District"),
    ("kinigi_pyrethrum", "Kinigi Pyrethrum Growers", "Musanze District"),
    ("karongi_coffee", "Karongi Highland Coffee", "Karongi District"),
    ("ruhango_tea", "Ruhango Tea Collective", "Ruhango District"),
    ("kayonza_hort", "Kayonza Fresh Produce Coop", "Kayonza District"),
    ("nyamasheke_tea", "Nyamasheke Tea Union", "Nyamasheke District"),
    ("muhanga_pyrethrum", "Muhanga Pyrethrum Association", "Muhanga District"),
    ("rutsiro_coffee", "Rutsiro Coffee Farmers", "Rutsiro District"),
    ("gatsibo_hort", "Gatsibo Horticulture Group", "Gatsibo District"),
]

BUYER_NAMES = [
    "Rwanda Trading Co.", "Kigali Fresh Mart", "East Africa Exporters Ltd",
    "Great Lakes Coffee Buyers", "Kigali Wholesale Market", "Nyarugenge Fresh Foods",
    "Sussex Coffee Importers", "Volcano Tea Exporters", "Bugesera Agro Traders",
    "Umurava Foods Ltd", "Huye Bulk Buyers", "Kirehe Grain & Produce",
    "Rwamagana Retail Group", "Musanze Wholesale Hub", "Nyagatare Trading",
    "Kigali Supermarket Chain", "Amahoro Commodities", "Rusizi Export Partners",
    "Gicumbi Market Union", "Rubavu Cross-Border Traders", "Karongi Coffee Roasters",
    "Nyamasheke Agro Ltd", "Kayonza Fresh Exports", "Gatsibo Produce Buyers",
    "Ruhango Grain Co.", "Muhanga Foods Ltd", "Ngororero Traders",
    "Kamonyi Fresh Market", "Rulindo Agro Traders", "Burera Wholesale Co.",
    "Gakenke Produce Ltd", "Nyabihu Market Group", "Ntarama Fresh Foods",
    "Rwamagana Exporters", "Kicukiro Retail Union", "Gasabo Food Distributors",
    "Nyarugenge Produce Hub", "Bugesera Fresh Co.", "Gisagara Traders",
    "Nyanza Wholesale Group", "Huye Export Collective", "Rusizi Market Union",
    "Nyamagabe Agro Buyers", "Karongi Produce Ltd", "Rutsiro Fresh Foods",
    "Nyabihu Export Co.", "Musanze Market Traders",
]

CROP_DATA = {
    "coffee": [
        ("Premium Arabica Coffee", 4500, 6200),
        ("Bourbon Arabica Beans", 4800, 6500),
        ("Robusta Coffee Beans", 3200, 4200),
        ("Fully Washed Arabica", 5100, 7000),
        ("Natural Process Arabica", 4700, 6800),
        ("Organic Green Coffee", 5500, 7200),
        ("Peaberry Coffee", 4900, 6400),
    ],
    "tea": [
        ("Organic Black Tea", 3200, 4500),
        ("Green Tea Leaves", 3600, 5200),
        ("White Tea Premium", 5500, 7800),
        ("Orthodox Black Tea", 3400, 4800),
        ("CTC Black Tea", 2800, 3900),
        ("Herbal Tea Blend", 3800, 5200),
    ],
    "horticulture": [
        ("Fresh Tomatoes", 800, 1500),
        ("Green Bell Peppers", 1200, 2100),
        ("Red Onions", 650, 1100),
        ("Carrots Grade A", 500, 900),
        ("French Beans", 1500, 2600),
        ("Snow Peas", 1800, 3100),
        ("Avocado Hass", 2200, 3800),
        ("Passion Fruit", 1400, 2400),
        ("Sweet Corn", 700, 1200),
        ("Irish Potatoes", 450, 850),
    ],
    "pyrethrum": [
        ("Dried Pyrethrum Flowers", 8500, 12000),
        ("Pyrethrum Extract Grade", 9500, 13500),
        ("Pyrethrum Powder", 7800, 11000),
    ],
}

QUALITY_GRADES = ["A", "A", "A", "B", "B", "C"]

ORDER_STATUSES = [
    ("Pending Transport", 25),
    ("In Transit", 25),
    ("Delivered", 45),
    ("Cancelled", 5),
]


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Seed the database with a large, realistic dataset for NAEB platform."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true",
                            help="Delete existing data before seeding.")
        parser.add_argument("--orders", type=int, default=400,
                            help="Number of orders to generate (default 400).")

    def handle(self, *args, **opts):
        random.seed(42)  # reproducible

        if opts["flush"]:
            self.stdout.write("Flushing existing data...")
            OrderTransaction.objects.all().delete()
            ProductListing.objects.all().delete()
            User.objects.all().delete()

        with transaction.atomic():
            admin = self._create_admin()
            farmers = self._create_farmers()
            buyers = self._create_buyers()
            listings = self._create_listings(farmers)
            self._create_orders(buyers, listings, num=opts["orders"])

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Seed complete:"
            f"\n  Users: {User.objects.count()}"
            f"\n  Farmers: {farmers.count()}"
            f"\n  Buyers: {buyers.count()}"
            f"\n  Listings: {listings.count()}"
            f"\n  Orders: {OrderTransaction.objects.count()}"
            f"\n\nLogin credentials:"
            f"\n  Admin:   admin / admin123"
            f"\n  Farmer:  farmer1 / farmer123  (through farmer12)"
            f"\n  Buyer:   buyer1 / buyer123    (through buyer47)"
        ))

    # -----------------------------------------------------------------

    def _create_admin(self):
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@naeb.rw",
                "role": "ADMIN",
                "is_verified": True,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "NAEB",
                "last_name": "Official",
                "phone_number": "+250788000001",
                "location_region": "Kigali",
            },
        )
        admin.set_password("admin123")
        admin.save()
        self.stdout.write("  ✓ admin created")
        return admin

    def _create_farmers(self):
        created = []
        for i, (username, display_name, region) in enumerate(FARMER_NAMES, start=1):
            user, _ = User.objects.get_or_create(
                username=f"farmer{i}",
                defaults={
                    "email": f"{username}@naeb.rw",
                    "first_name": display_name.split()[0],
                    "last_name": "Cooperative",
                    "role": "FARMER",
                    "is_verified": i <= 10,          # first 10 verified
                    "phone_number": f"+25078800{1000 + i}",
                    "location_region": region,
                },
            )
            user.set_password("farmer123")
            user.save()
            created.append(user)
        self.stdout.write(f"  ✓ {len(created)} farmers created")
        return User.objects.filter(role="FARMER")

    def _create_buyers(self):
        for i, name in enumerate(BUYER_NAMES, start=1):
            user, _ = User.objects.get_or_create(
                username=f"buyer{i}",
                defaults={
                    "email": f"buyer{i}@example.rw",
                    "first_name": name.split()[0],
                    "last_name": "Buyer",
                    "role": "BUYER",
                    "is_verified": i <= 40,          # first 40 verified
                    "phone_number": f"+25078801{i:04d}",
                    "location_region": "Kigali" if i % 3 == 0 else "Huye",
                },
            )
            user.set_password("buyer123")
            user.save()
        buyers = User.objects.filter(role="BUYER")
        self.stdout.write(f"  ✓ {buyers.count()} buyers created")
        return buyers

    def _create_listings(self, farmers):
        now = timezone.now()
        created_count = 0

        for farmer in farmers:
            # 8–18 listings per farmer
            num_listings = random.randint(8, 18)
            categories = list(CROP_DATA.keys())
            for _ in range(num_listings):
                category = random.choice(categories)
                crop_name, price_lo, price_hi = random.choice(CROP_DATA[category])
                qty = Decimal(random.randint(150, 8000))
                price = Decimal(random.randint(price_lo, price_hi))
                grade = random.choice(QUALITY_GRADES)

                ProductListing.objects.create(
                    farmer=farmer,
                    crop_name=crop_name,
                    crop_category=category,
                    quantity_available=qty,
                    price_per_kg=price,
                    quality_grade=grade,
                    location=farmer.location_region,
                    is_active=random.random() > 0.12,     # 88% active
                )
                created_count += 1

        listings = ProductListing.objects.all()
        self.stdout.write(f"  ✓ {listings.count()} product listings created")
        return listings

    def _create_orders(self, buyers, listings, num):
        listing_list = list(listings.filter(is_active=True))
        buyer_list = list(buyers)
        statuses = [s for s, w in ORDER_STATUSES]
        weights = [w for s, w in ORDER_STATUSES]

        now = timezone.now()
        created = 0
        contract_suffixes = set()

        for _ in range(num):
            buyer = random.choice(buyer_list)
            product = random.choice(listing_list)

            # Quantity must not exceed available stock OR listing stock
            max_qty = min(500, int(product.quantity_available))
            if max_qty < 1:
                continue
            qty = Decimal(random.randint(1, max_qty))
            total = qty * product.price_per_kg

            status = random.choices(statuses, weights=weights, k=1)[0]
            days_ago = random.randint(0, 90)
            created_at = now - timedelta(days=days_ago,
                                        hours=random.randint(0, 23),
                                        minutes=random.randint(0, 59))

            # Unique contract reference
            ref = None
            for _try in range(5):
                candidate = f"ORD-{created_at.year}-{uuid.uuid4().hex[:6].upper()}"
                if candidate not in contract_suffixes:
                    ref = candidate
                    break
            if ref is None:
                continue
            contract_suffixes.add(ref)

            order = OrderTransaction(
                buyer=buyer,
                product=product,
                quantity_ordered=qty,
                total_amount=total,
                delivery_status=status,
                delivery_address=f"{buyer.location_region} — Warehouse {random.randint(1, 20)}",
                contract_reference=ref,
            )
            # Bypass save() auto-ref and then pin the historical timestamp
            order.save()
            OrderTransaction.objects.filter(pk=order.pk).update(created_at=created_at,
                                                                updated_at=created_at)
            created += 1

        self.stdout.write(f"  ✓ {created} orders created")