import { calculateCartQuantity } from "../data/cart.js";
import { getOrders } from "../data/orders.js";
import { getProduct } from "../data/products.js";
import { formatCurrency } from "./utils/money.js";
import {
  getDeliveryOption,
  calculateDeliveryDate,
} from "../data/deliveryOptions.js"; // Assuming deliveryOptionId is on order items
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";

function updateCartQuantityDisplay() {
  const cartQuantity = calculateCartQuantity();
  console.log(
    "[Orders Page] Calculated cart quantity for display:",
    cartQuantity
  );
  const cartQuantityElement = document.querySelector(".js-cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.innerHTML = cartQuantity > 0 ? cartQuantity : 0;
    console.log("[Orders Page] Updated .js-cart-quantity innerHTML.");
  } else {
    console.error("[Orders Page] .js-cart-quantity element not found!");
  }
}

function renderOrdersPage() {
  console.log("[Orders Page] renderOrdersPage called.");
  const orders = getOrders(); // This will now log from data/orders.js
  console.log("[Orders Page] Orders fetched for rendering:", orders);
  const ordersGrid = document.querySelector(".orders-grid");

  if (!ordersGrid) {
    console.error("[Orders Page] .orders-grid element not found!");
    return;
  }

  if (orders.length === 0) {
    console.log("[Orders Page] No orders found. Displaying empty message.");
    ordersGrid.innerHTML =
      "<p>You have no past orders. Try placing an order from the checkout page!</p>";
    updateCartQuantityDisplay();
    return;
  }

  let ordersHTML = "";
  console.log("[Orders Page] Starting to generate HTML for orders...");
  orders.forEach((order) => {
    console.log("[Orders Page] Processing order:", order);
    const orderTime = dayjs(order.orderTime);

    ordersHTML += `
      <div class="order-container">
        <div class="order-header">
          <div class="order-header-left-section">
            <div class="order-date">
              <div class="order-header-label">Order Placed:</div>
              <div>${orderTime.format("MMMM D, YYYY")}</div>
            </div>
            <div class="order-total">
              <div class="order-header-label">Total:</div>
              <div>$${formatCurrency(order.totalAmountCents)}</div>
            </div>
          </div>
          <div class="order-header-right-section">
            <div class="order-header-label">Order ID:</div>
            <div>${order.id}</div>
          </div>
        </div>
        <div class="order-details-grid">
    `;

    order.items.forEach((item) => {
      const product = getProduct(item.productId);
      if (!product) {
        console.error(
          `[Orders Page] Product with ID ${item.productId} not found for order ${order.id}`
        );
        return; // Skip this item if product details are missing
      }
      console.log(
        `[Orders Page] Product found for item ${item.productId}:`,
        product
      );

      // Delivery date calculation for each item
      // Each item in the order should have its deliveryOptionId stored from the cart
      const deliveryOption = getDeliveryOption(item.deliveryOptionId);
      let deliveryDateString = "N/A";
      if (deliveryOption) {
        // Pass the order.orderTime as the startDate for calculating delivery date for past orders
        deliveryDateString = calculateDeliveryDate(
          deliveryOption,
          dayjs(order.orderTime)
        );
      }

      ordersHTML += `
        <div class="product-image-container">
          <img src="${product.image}">
        </div>
        <div class="product-details">
          <div class="product-name">
            ${product.name}
          </div>
          <div class="product-delivery-date">
            Arriving on: ${deliveryDateString}
          </div>
          <div class="product-quantity">
            Quantity: ${item.quantity}
          </div>
          <button class="buy-again-button button-primary js-buy-again" data-product-id="${product.id}">
            <img class="buy-again-icon" src="images/icons/buy-again.png">
            <span class="buy-again-message">Buy it again</span>
          </button>
        </div>
        <div class="product-actions">
          <a href="tracking.html?orderId=${order.id}&productId=${product.id}">
            <button class="track-package-button button-secondary">
              Track package
            </button>
          </a>
        </div>
      `;
    });

    ordersHTML += `
        </div> <!-- Closing order-details-grid -->
      </div> <!-- Closing order-container -->
    `;
  });
  console.log(
    "[Orders Page] Finished generating HTML. Total length:",
    ordersHTML.length
  );

  ordersGrid.innerHTML = ordersHTML;
  console.log("[Orders Page] Injected orders HTML into .orders-grid.");

  // Add event listeners for "Buy it again" buttons
  document.querySelectorAll(".js-buy-again").forEach((button) => {
    button.addEventListener("click", () => {
      // We need addToCart from cart.js.
      // For simplicity, let's assume it's globally available or we import it.
      // For now, this will require addToCart to be imported.
      // import { addToCart } from '../data/cart.js';
      // For this example, I will just log it. A full implementation would add to cart and update UI.
      console.log(
        "Attempting to buy again product ID:",
        button.dataset.productId
      );
      alert(
        '"Buy it again" clicked for product ID: ' +
          button.dataset.productId +
          ". Implementation pending."
      );
      // Potentially:
      // addToCart(button.dataset.productId, 1); // Add 1 quantity by default
      // updateCartQuantityDisplay();
    });
  });

  updateCartQuantityDisplay();
  console.log("[Orders Page] renderOrdersPage finished.");
}

// Initial render
console.log(
  "[Orders Page] Script loaded. Calling initial renderOrdersPage and updateCartQuantityDisplay."
);
renderOrdersPage();

// We also need to update the cart quantity display initially
// updateCartQuantityDisplay(); // This is already called at the end of renderOrdersPage
