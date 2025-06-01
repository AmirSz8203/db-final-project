import { calculateCartQuantity } from "../data/cart.js";
import { getOrders } from "../data/orders.js";
import { getProduct } from "../data/products.js";
import {
  getDeliveryOption,
  calculateDeliveryDate,
} from "../data/deliveryOptions.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";

// UTC plugin import is removed as the file was deleted.
// Date operations will be in local time.

function updateCartQuantityDisplay() {
  const cartQuantity = calculateCartQuantity();
  const cartQuantityElement = document.querySelector(".js-cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.innerHTML = cartQuantity > 0 ? cartQuantity : 0;
  }
}

function renderTrackingPage() {
  console.log("[TrackingPage] renderTrackingPage called.");
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const productId = urlParams.get("productId");

  const trackingContainer = document.querySelector(".order-tracking");
  if (!trackingContainer) {
    console.error(
      "[TrackingPage] Tracking container .order-tracking not found."
    );
    return;
  }

  if (!orderId || !productId) {
    trackingContainer.innerHTML =
      "<p>Error: Order ID or Product ID missing from URL.</p>";
    console.error("[TrackingPage] Missing orderId or productId in URL.");
    updateCartQuantityDisplay(); // Still update cart quantity
    return;
  }
  console.log(`[TrackingPage] orderId: ${orderId}, productId: ${productId}`);

  const orders = getOrders();
  const currentOrder = orders.find((order) => order.id === orderId);

  if (!currentOrder) {
    trackingContainer.innerHTML = `<p>Error: Order with ID ${orderId} not found.</p>`;
    console.error(`[TrackingPage] Order ${orderId} not found.`);
    updateCartQuantityDisplay();
    return;
  }
  console.log("[TrackingPage] currentOrder:", currentOrder);

  const currentItem = currentOrder.items.find(
    (item) => item.productId === productId
  );

  if (!currentItem) {
    trackingContainer.innerHTML = `<p>Error: Product with ID ${productId} not found in order ${orderId}.</p>`;
    console.error(
      `[TrackingPage] Product ${productId} not in order ${orderId}.`
    );
    updateCartQuantityDisplay();
    return;
  }
  console.log("[TrackingPage] currentItem:", currentItem);

  const productDetails = getProduct(currentItem.productId);
  if (!productDetails) {
    trackingContainer.innerHTML = `<p>Error: Product details not found for ID ${productId}.</p>`;
    console.error(`[TrackingPage] Product details for ${productId} not found.`);
    updateCartQuantityDisplay();
    return;
  }
  console.log("[TrackingPage] productDetails:", productDetails);

  const deliveryOption = getDeliveryOption(currentItem.deliveryOptionId);
  if (!deliveryOption) {
    trackingContainer.innerHTML = `<p>Error: Delivery option details not found for item deliveryOptionId: ${currentItem.deliveryOptionId}.</p>`;
    console.error(
      `[TrackingPage] Delivery option ${currentItem.deliveryOptionId} not found.`
    );
    updateCartQuantityDisplay();
    return;
  }
  console.log("[TrackingPage] deliveryOption:", deliveryOption);

  const orderDate = dayjs(currentOrder.orderTime);
  console.log(
    "[TrackingPage] orderDate (from order.orderTime):",
    orderDate.format()
  );

  const estimatedDeliveryDateString = calculateDeliveryDate(
    deliveryOption,
    orderDate
  );
  console.log(
    "[TrackingPage] Estimated delivery date string from calculateDeliveryDate:",
    estimatedDeliveryDateString
  );

  let estimatedDeliveryDate;
  if (
    estimatedDeliveryDateString &&
    typeof estimatedDeliveryDateString === "string" &&
    estimatedDeliveryDateString.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    estimatedDeliveryDate = dayjs(estimatedDeliveryDateString); // Parse as local time
  } else {
    console.error(
      "[TrackingPage] Invalid estimatedDeliveryDateString format from calculateDeliveryDate:",
      estimatedDeliveryDateString
    );
    // Display error and stop further processing for this item's date-dependent parts
    document.getElementById("js-delivery-date").textContent =
      "Arriving date: Error (Invalid Format)";
    estimatedDeliveryDate = null; // Ensure it's null if invalid
  }

  if (estimatedDeliveryDate) {
    console.log(
      "[TrackingPage] Parsed estimatedDeliveryDate (local time):",
      estimatedDeliveryDate.format(),
      "isValid:",
      estimatedDeliveryDate.isValid()
    );
  }

  // Update HTML Elements
  const deliveryDateEl = document.getElementById("js-delivery-date");
  const productNameEl = document.getElementById("js-product-name");
  const productQuantityEl = document.getElementById("js-product-quantity");
  const productImageEl = document.getElementById("js-product-image");

  if (
    deliveryDateEl &&
    estimatedDeliveryDate &&
    estimatedDeliveryDate.isValid()
  ) {
    deliveryDateEl.textContent = `Arriving on ${estimatedDeliveryDate.format(
      "dddd, MMMM D"
    )}`;
  } else if (deliveryDateEl && !estimatedDeliveryDate) {
    // Error already logged, message set above if format was bad
  } else if (deliveryDateEl) {
    deliveryDateEl.textContent = "Arriving date: Error calculating";
  }

  if (productNameEl) productNameEl.textContent = productDetails.name;
  if (productQuantityEl)
    productQuantityEl.textContent = `Quantity: ${currentItem.quantity}`;
  if (productImageEl) productImageEl.src = productDetails.image;

  // Simplified Progress Bar Logic (No UTC, No Shipped status for now)
  const preparingLabel = document.getElementById("js-progress-preparing");
  const shippedLabel = document.getElementById("js-progress-shipped"); // Will be unused for now
  const deliveredLabel = document.getElementById("js-progress-delivered");
  const progressBar = document.getElementById("js-progress-bar");

  // Clear previous statuses
  if (preparingLabel) preparingLabel.classList.remove("current-status");
  if (shippedLabel) shippedLabel.classList.remove("current-status");
  if (deliveredLabel) deliveredLabel.classList.remove("current-status");

  let status = "Preparing";
  let progressPercent = 20; // Default

  if (estimatedDeliveryDate && estimatedDeliveryDate.isValid()) {
    const now = dayjs().startOf("day"); // Compare start of current day with start of delivery day
    const deliveryDay = estimatedDeliveryDate.startOf("day");

    if (now.isAfter(deliveryDay) || now.isSame(deliveryDay)) {
      status = "Delivered";
      progressPercent = 100;
      if (deliveredLabel) deliveredLabel.classList.add("current-status");
    } else {
      status = "Preparing";
      progressPercent = 20;
      if (preparingLabel) preparingLabel.classList.add("current-status");
    }
  } else {
    // If no valid estimated delivery date, default to preparing
    status = "Preparing";
    progressPercent = 20;
    if (preparingLabel) preparingLabel.classList.add("current-status");
    console.warn(
      "[TrackingPage] No valid estimated delivery date for progress calculation."
    );
  }

  console.log(
    `[TrackingPage] Final Simplified Status: ${status} (${progressPercent}%)`
  );
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  updateCartQuantityDisplay(); // Call this at the end too
}

// Initial calls
updateCartQuantityDisplay();
renderTrackingPage();
