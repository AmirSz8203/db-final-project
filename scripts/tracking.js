import { calculateCartQuantity } from "../data/cart.js";
import {
  getDeliveryOption,
  calculateDeliveryDate,
} from "../data/deliveryOptions.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";

const API_BASE_URL = "http://localhost:8001";

// --- Helper: Update Cart Quantity ---
function updateCartQuantityDisplay() {
  const cartQuantity = calculateCartQuantity();
  const cartQuantityElement = document.querySelector(".js-cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.innerHTML = cartQuantity > 0 ? cartQuantity : 0;
  }
}

// --- Helper: Setup Auth Link (Login/Logout) ---
async function setupAuthLink() {
  const token = localStorage.getItem("accessToken");
  const authLink = document.getElementById("auth-link");
  const authLine1 = document.getElementById("auth-line1");

  if (token && authLink && authLine1) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        authLine1.textContent = user.username;
        authLink.href = "#";

        authLink.addEventListener("click", (e) => {
          e.preventDefault();
          if (confirm("Are you sure you want to log out?")) {
            localStorage.removeItem("accessToken");
            window.location.href = "login.html";
          }
        });

        authLink.addEventListener("mouseover", () => {
          authLine1.textContent = "Logout?";
        });
        authLink.addEventListener("mouseout", () => {
          authLine1.textContent = user.username;
        });
      } else {
        localStorage.removeItem("accessToken");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      localStorage.removeItem("accessToken");
    }
  }
}

// --- Helper: Fetch API with JWT ---
async function fetchWithAuth(url) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    window.location.href = "login.html";
    throw new Error("No access token found. Redirecting to login.");
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    window.location.href = "login.html";
    throw new Error("Token expired or invalid.");
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// --- API: Get Single Product ---
async function getProduct(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

// --- API: Get User Orders ---
async function fetchUserOrders() {
  return await fetchWithAuth(`${API_BASE_URL}/orders`);
}

// --- Main Render Logic ---
async function renderTrackingPage() {
  console.log("[TrackingPage] renderTrackingPage called.");

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const productId = urlParams.get("productId");

  const trackingContainer = document.querySelector(".order-tracking");
  if (!trackingContainer) return;

  if (!orderId || !productId) {
    trackingContainer.innerHTML =
      "<p>Error: Order ID or Product ID missing from URL.</p>";
    updateCartQuantityDisplay();
    return;
  }

  try {
    // 1. Fetch Orders to find the specific order
    const orders = await fetchUserOrders();
    const currentOrder = orders.find(
      (order) => String(order.id) === String(orderId),
    );

    if (!currentOrder) {
      trackingContainer.innerHTML = `<p>Error: Order with ID ${orderId} not found.</p>`;
      updateCartQuantityDisplay();
      return;
    }

    // 2. Find the specific item in the order
    const currentItem = currentOrder.items.find(
      (item) => String(item.product_id) === String(productId),
    );

    if (!currentItem) {
      trackingContainer.innerHTML = `<p>Error: Product ${productId} not found in order ${orderId}.</p>`;
      updateCartQuantityDisplay();
      return;
    }

    // 3. Fetch Product Details
    const productDetails = await getProduct(productId);
    if (!productDetails) {
      trackingContainer.innerHTML = `<p>Error: Product details not found.</p>`;
      updateCartQuantityDisplay();
      return;
    }

    // 4. Calculate Delivery Date
    const deliveryOption = getDeliveryOption(currentItem.delivery_option_id);
    const orderDate = dayjs(currentOrder.order_date);
    const estimatedDeliveryDateString = calculateDeliveryDate(
      deliveryOption,
      orderDate,
    );

    let estimatedDeliveryDate = null;
    if (
      estimatedDeliveryDateString &&
      typeof estimatedDeliveryDateString === "string"
    ) {
      estimatedDeliveryDate = dayjs(estimatedDeliveryDateString);
    }

    // 5. Update HTML Elements
    const deliveryDateEl = document.getElementById("js-delivery-date");
    const productNameEl = document.getElementById("js-product-name");
    const productQuantityEl = document.getElementById("js-product-quantity");
    const productImageEl = document.getElementById("js-product-image");

    if (
      deliveryDateEl &&
      estimatedDeliveryDate &&
      estimatedDeliveryDate.isValid()
    ) {
      deliveryDateEl.textContent = `Arriving on ${estimatedDeliveryDate.format("dddd, MMMM D")}`;
    } else if (deliveryDateEl) {
      deliveryDateEl.textContent = "Arriving date: Error calculating";
    }

    if (productNameEl) productNameEl.textContent = productDetails.name;
    if (productQuantityEl)
      productQuantityEl.textContent = `Quantity: ${currentItem.quantity}`;
    if (productImageEl) productImageEl.src = productDetails.image;

    // 6. Progress Bar Logic
    const preparingLabel = document.getElementById("js-progress-preparing");
    const shippedLabel = document.getElementById("js-progress-shipped");
    const deliveredLabel = document.getElementById("js-progress-delivered");
    const progressBar = document.getElementById("js-progress-bar");

    if (preparingLabel) preparingLabel.classList.remove("current-status");
    if (shippedLabel) shippedLabel.classList.remove("current-status");
    if (deliveredLabel) deliveredLabel.classList.remove("current-status");

    let status = "Preparing";
    let progressPercent = 20;

    if (
      estimatedDeliveryDate &&
      estimatedDeliveryDate.isValid() &&
      deliveryOption
    ) {
      const now = dayjs().startOf("day");
      const deliveryDay = estimatedDeliveryDate.startOf("day");

      if (now.isSame(deliveryDay) || now.isAfter(deliveryDay)) {
        status = "Delivered";
        progressPercent = 100;
        if (deliveredLabel) deliveredLabel.classList.add("current-status");
      } else {
        const shippedThresholdDate = orderDate.startOf("day").add(1, "day");
        if (
          now.isSame(shippedThresholdDate) ||
          now.isAfter(shippedThresholdDate)
        ) {
          status = "Shipped";
          progressPercent = 60;
          if (shippedLabel) shippedLabel.classList.add("current-status");
        } else {
          status = "Preparing";
          progressPercent = 20;
          if (preparingLabel) preparingLabel.classList.add("current-status");
        }
      }
    } else {
      if (preparingLabel) preparingLabel.classList.add("current-status");
    }

    console.log(
      `[TrackingPage] Progress Status: ${status} (${progressPercent}%)`,
    );
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
  } catch (error) {
    console.error("[TrackingPage] Error during render:", error);
    trackingContainer.innerHTML =
      "<p>Could not load tracking information. Please try again later.</p>";
  }

  updateCartQuantityDisplay();
}

// --- Initial Calls ---
document.addEventListener("DOMContentLoaded", () => {
  setupAuthLink();
  updateCartQuantityDisplay();
  renderTrackingPage();
});
