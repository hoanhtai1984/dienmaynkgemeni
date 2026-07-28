const { BADGE_TO_LABEL } = require('./badge');

function serializeProduct(product) {
  const images = [...(product.images || [])]
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);

  const discount =
    product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category ? product.category.slug : undefined,
    categoryName: product.category ? product.category.name : undefined,
    subCategory: product.subCategory ? product.subCategory.slug : null,
    subCategoryName: product.subCategory ? product.subCategory.name : null,
    subSubCategory: product.subSubCategory ? product.subSubCategory.slug : null,
    subSubCategoryName: product.subSubCategory ? product.subSubCategory.name : null,
    price: product.price,
    oldPrice: product.oldPrice,
    discount,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    sold: product.sold,
    promoEndsAt: product.promoEndsAt,
    promoSlots: product.promoSlots,
    promoSold: product.promoSold,
    badge: product.badge ? BADGE_TO_LABEL[product.badge] : '',
    image: images[0] || null,
    images,
    description: product.description,
    specs: product.specs,
  };
}

module.exports = { serializeProduct };
