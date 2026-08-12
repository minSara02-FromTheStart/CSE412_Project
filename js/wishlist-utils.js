function normaliseProduct(product) {
  if (!product || !product.id) return null;

  return {
    id: String(product.id),
    productId: String(product.id),
    name: product.name || "Product",
    price: Number(product.price) || 0,
    unit: product.unit || "KG",
    image: product.image || "https://via.placeholder.com/300",
    desc: product.desc || product.description || ""
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    normaliseProduct
  };
}