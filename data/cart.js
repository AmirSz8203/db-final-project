export const cart = [
  {
    productId: "id1",
    quantity: 2,
  },
  {
    productId: "id2",
    quantity: 1,
  },
];

export function addToCart(productId, quantity) {
  let matchingItem;
  cart.forEach((item) => {
    if (productId === item.productId) {
      matchingItem = item;
    }
  });

  if (matchingItem) {
    matchingItem.quantity += quantity;
  } else {
    cart.push({
      productId,
      quantity,
    });
  }
}
