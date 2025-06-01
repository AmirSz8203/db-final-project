import { calculateCartQuantity } from "../data/cart.js";

function updateCartQuantityDisplay() {
  const cartQuantity = calculateCartQuantity();
  const cartQuantityElement = document.querySelector(".js-cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.innerHTML = cartQuantity;
  }
}

updateCartQuantityDisplay();
