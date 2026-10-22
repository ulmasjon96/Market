from django.contrib import admin
from .models import Category, Product, ProductImage, Order, OrderItem, Profile, WishlistItem, ProductReview, PromoBanner


@admin.register(PromoBanner)
class PromoBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')


admin.site.register((Category, Product, ProductImage, Order, OrderItem, Profile, WishlistItem, ProductReview))
