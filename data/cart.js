import { getProduct } from "./products.js"; // Import getProduct

// Helper function to initialize cart with prices
function initializeCartWithPrices(initialCart) {
  if (!initialCart) return [];
  return initialCart.map((item) => {
    const product = getProduct(item.productId);
    return {
      ...item,
      priceWhenAddedCents: product ? product.effectivePriceCents : 0, // Store effective price
    };
  });
}

export let cart =
  initializeCartWithPrices(JSON.parse(localStorage.getItem("cart"))) ||
  initializeCartWithPrices([
    {
      productId: "id1", // Backpack (10% off 2670 = 2403)
      quantity: 2,
      deliveryOptionId: "1",
      // priceWhenAddedCents will be populated by initializeCartWithPrices
    },
    {
      productId: "id2", // Umbrella (no discount, 2380)
      quantity: 1,
      deliveryOptionId: "2",
      // priceWhenAddedCents will be populated by initializeCartWithPrices
    },
  ]);

// Ensure cart is an array even if localStorage is empty or initializeCartWithPrices returns null/undefined for some reason
if (!Array.isArray(cart)) {
  cart = initializeCartWithPrices([
    {
      productId: "id1",
      quantity: 2,
      deliveryOptionId: "1",
    },
    {
      productId: "id2",
      quantity: 1,
      deliveryOptionId: "2",
    },
  ]);
}

function saveToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function getCart() {
  // Return a deep copy to prevent external modification
  return JSON.parse(JSON.stringify(cart));
}

export function addToCart(productId, quantity) {
  const product = getProduct(productId); // Get product details including effective price
  if (!product) {
    console.error(
      `Product with ID ${productId} not found when adding to cart.`
    );
    return; // Do not add if product is not found
  }

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
      deliveryOptionId: "1",
      priceWhenAddedCents: product.effectivePriceCents, // Store the price at the time of adding
    });
  }
  saveToStorage();
}

export function removeFromCart(productId) {
  const newCart = [];

  cart.forEach((cartItem) => {
    if (cartItem.productId !== productId) {
      newCart.push(cartItem);
    }
  });
  cart = newCart;

  saveToStorage();
}
export function calculateCartQuantity() {
  let cartQuantity = 0;

  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity;
  });

  return cartQuantity;
}

export function updateQuantity(productId, newQuantity) {
  let matchingItem;

  cart.forEach((cartItem) => {
    if (productId === cartItem.productId) {
      matchingItem = cartItem;
    }
  });

  matchingItem.quantity = newQuantity;

  saveToStorage();
}

export function updateDeliveryOption(productId, deliveryOptionId) {
  let matchingItem;
  cart.forEach((item) => {
    if (productId === item.productId) {
      matchingItem = item;
    }
  });

  matchingItem.deliveryOptionId = deliveryOptionId;

  saveToStorage();
}

export function resetCart() {
  cart = [];
  saveToStorage();
}
