import {
  calculateCartQuantity,
  cart,
  removeFromCart,
  updateQuantity,
  updateDeliveryOption,
} from "../../data/cart.js";
import { products, getProduct } from "../../data/products.js";
import { formatCurrency } from "../utils/money.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";
import {
  deliveryOptions,
  getDeliveryOption,
  calculateDeliveryDate,
} from "../../data/deliveryOptions.js";
import { renderPaymentSummary } from "./paymentSummary.js";
import { renderCheckoutHeader } from "./checkoutHeader.js";

export function renderOrderSummary() {
  let cartSummaryHTML = "";
  const currentCart = cart; // Use the imported cart which should now have priceWhenAddedCents

  currentCart.forEach((cartItem) => {
    const productId = cartItem.productId;
    // getProduct now returns effectivePriceCents but we should rely on cartItem.priceWhenAddedCents for consistency
    const matchingProductInfo = getProduct(productId);

    if (!matchingProductInfo) {
      console.error(
        `Product info not found for ID: ${productId} in renderOrderSummary`
      );
      return; // Skip this item if basic product info is missing
    }

    const deliveryOptionId = cartItem.deliveryOptionId;
    const deliveryOption = getDeliveryOption(deliveryOptionId);
    const dateString = calculateDeliveryDate(deliveryOption);

    // Use cartItem.priceWhenAddedCents for display
    const itemPriceForDisplay =
      cartItem.priceWhenAddedCents !== undefined
        ? cartItem.priceWhenAddedCents
        : matchingProductInfo.effectivePriceCents; // Fallback if somehow not set, though it should be

    cartSummaryHTML += `
      <div class="cart-item-container 
      js-cart-item-container-${matchingProductInfo.id}">
        <div class="delivery-date">
        Delivery date: ${dateString}
        </div>
  
        <div class="cart-item-details-grid">
          <img
            class="product-image"
            src="${matchingProductInfo.image}"
          />
  
          <div class="cart-item-details">
            <div class="product-name">
              ${matchingProductInfo.name}
            </div>
            <div class="product-price">
              $${formatCurrency(itemPriceForDisplay)}
            </div>
            <div class="product-quantity">
              <span>
                Quantity: <span
                class="quantity-label js-quantity-label-${
                  matchingProductInfo.id
                }">
                ${cartItem.quantity}
              </span>
              </span>
              <span class="update-quantity-link link-primary 
                js-update-link" data-product-id="${matchingProductInfo.id}">
                Update
              </span>
              <input class="quantity-input 
              js-quantity-input-${matchingProductInfo.id}">
              <span class="save-quantity-link link-primary 
                js-save-link" data-product-id="${matchingProductInfo.id}">
                Save
              </span>
              <span class="delete-quantity-link link-primary 
                js-delete-link" data-product-id="${matchingProductInfo.id}">
                Delete
              </span>
            </div>
          </div>
  
          <div class="delivery-options">
            <div class="delivery-options-title">Choose a delivery option:</div> 
            ${deliveryOptionsHTML(matchingProductInfo, cartItem)}      
          </div>
        </div>
      </div>
    `;
  });

  function deliveryOptionsHTML(matchingProduct, cartItem) {
    let html = "";
    deliveryOptions.forEach((deliveryOption) => {
      const dateString = calculateDeliveryDate(deliveryOption);
      const priceString =
        deliveryOption.priceCents === 0
          ? "FREE"
          : `$${formatCurrency(deliveryOption.priceCents)} -`;

      const isChecked = deliveryOption.id === cartItem.deliveryOptionId;

      html += `
        <div class="delivery-option js-delivery-option"
          data-product-id="${matchingProduct.id}"
          data-delivery-option-id="${deliveryOption.id}">
          <input
            type="radio"
            ${isChecked ? "checked" : ""}
            class="delivery-option-input"
            name="delivery-option-${matchingProduct.id}"
          />
          <div>
            <div class="delivery-option-date">${dateString}</div>
            <div class="delivery-option-price">$${priceString} Shipping</div>
          </div>
        </div>
      `;
    });
    return html;
  }

  document.querySelector(".js-order-summary").innerHTML = cartSummaryHTML;

  document.querySelectorAll(".js-update-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = link.dataset.productId;
      const container = document.querySelector(
        `.js-cart-item-container-${productId}`
      );
      container.classList.add("is-editing-quantity");
    });
  });

  document.querySelectorAll(".js-save-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = link.dataset.productId;
      const quantityInput = document.querySelector(
        `.js-quantity-input-${productId}`
      );
      const newQuantity = Number(quantityInput.value);

      if (newQuantity < 0 || newQuantity >= 1000) {
        alert("Quantity must be at least 0 and less than 1000");
        return;
      }
      updateQuantity(productId, newQuantity);

      const container = document.querySelector(
        `.js-cart-item-container-${productId}`
      );
      container.classList.remove("is-editing-quantity");

      const quantityLabel = document.querySelector(
        `.js-quantity-label-${productId}`
      );
      quantityLabel.innerHTML = newQuantity;
      updateCartQuantity();
      renderPaymentSummary();
    });
  });

  document.querySelectorAll(".js-delete-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = link.dataset.productId;
      removeFromCart(productId);
      updateCartQuantity();
      renderOrderSummary();
      renderPaymentSummary();
    });
  });

  function updateCartQuantity() {
    const cartQuantity = calculateCartQuantity();

    document.querySelector(
      ".js-return-to-home-link"
    ).innerHTML = `${cartQuantity} items`;
  }
  updateCartQuantity();
  document.querySelectorAll(".js-delivery-option").forEach((element) => {
    element.addEventListener("click", () => {
      const { productId, deliveryOptionId } = element.dataset;
      updateDeliveryOption(productId, deliveryOptionId);
      renderCheckoutHeader();
      renderOrderSummary();
      renderPaymentSummary();
    });
  });
}
