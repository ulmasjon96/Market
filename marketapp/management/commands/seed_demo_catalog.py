from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from marketapp.models import Category, Product, ProductImage


PRODUCTS = [
    {
        'category': 'Elektronika',
        'category_slug': 'demo-elektronika',
        'name': 'Simsiz naushnik Studio One',
        'slug': 'demo-simsiz-naushnik-studio-one',
        'price': Decimal('349000'),
        'image': 'demo_products/wireless-headphones.jpg',
        'description': 'Demo mahsulot. Kundalik tinglash uchun simsiz naushnik. Narxi va tavsifi namuna uchun kiritilgan.',
    },
    {
        'category': 'Uy va oshxona',
        'category_slug': 'demo-uy-oshxona',
        'name': 'Oq sopol krujka',
        'slug': 'demo-oq-sopol-krujka',
        'price': Decimal('89000'),
        'image': 'demo_products/ceramic-mug.jpg',
        'description': 'Demo mahsulot. Sodda oq sopol krujka. Narxi va tavsifi haqiqiy taklif hisoblanmaydi.',
    },
    {
        'category': 'Uy va oshxona',
        'category_slug': 'demo-uy-oshxona',
        'name': 'Uy guli va sopol tuvak',
        'slug': 'demo-uy-guli-sopol-tuvak',
        'price': Decimal('149000'),
        'image': 'demo_products/indoor-plant.jpg',
        'description': 'Demo mahsulot. Xona uchun dekorativ yashil o‘simlik. Narxi va tavsifi namuna uchun.',
    },
    {
        'category': 'Uy dekorlari',
        'category_slug': 'demo-uy-dekorlari',
        'name': 'Minimalist sopol vaza',
        'slug': 'demo-sopol-vaza',
        'price': Decimal('129000'),
        'image': 'demo_products/ceramic-vase.jpg',
        'description': 'Demo mahsulot. Interyer uchun minimal uslubdagi sopol vaza. Narxi namuna uchun.',
    },
    {
        'category': 'Uy va oshxona',
        'category_slug': 'demo-uy-oshxona',
        'name': 'Sopol salat idishi',
        'slug': 'demo-sopol-salat-idishi',
        'price': Decimal('99000'),
        'image': 'demo_products/ceramic-bowl-revised.jpg',
        'description': 'Demo mahsulot. Kundalik dasturxon uchun sopol idish. Narxi va tavsifi namuna uchun.',
    },
]


class Command(BaseCommand):
    help = 'Adds the clearly marked sample catalog after its generated images are present.'

    def handle(self, *args, **options):
        asset_root = Path(__file__).resolve().parents[2] / 'static' / 'shop'
        missing = [item['image'] for item in PRODUCTS if not (asset_root / item['image']).is_file()]
        if missing:
            raise CommandError('Demo rasmlar topilmadi: ' + ', '.join(missing))

        for item in PRODUCTS:
            category, _ = Category.objects.get_or_create(
                slug=item['category_slug'], defaults={'name': item['category']},
            )
            product = Product.objects.filter(slug=item['slug']).first()
            if product and not product.is_demo:
                raise CommandError(f"'{item['slug']}' slugli haqiqiy mahsulot bor; demo mahsulot qo‘shilmadi.")
            if product is None:
                product = Product.objects.create(
                    category=category,
                    name=item['name'],
                    slug=item['slug'],
                    description=item['description'],
                    price=item['price'],
                    stock=5,
                    is_active=True,
                    is_demo=True,
                )
            image, created = ProductImage.objects.get_or_create(
                product=product,
                static_path=f"shop/{item['image']}",
                defaults={'is_main': True},
            )
            if not image.is_main:
                image.is_main = True
                image.save(update_fields=['is_main'])

        self.stdout.write(self.style.SUCCESS(f'{len(PRODUCTS)} ta demo mahsulot tayyor.'))
