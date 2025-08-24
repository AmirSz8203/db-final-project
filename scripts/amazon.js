import { addToCart, calculateCartQuantity } from "../data/cart.js";

let products = [];
const API_BASE_URL = "http://localhost:8000";

const productsGridElement = document.querySelector(".js-products-grid");
const searchBarElement = document.querySelector(".search-bar");
const searchButtonElement = document.querySelector(".search-button");

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    products = await response.json();
    renderProductsGrid(products);
  } catch (error) {
    console.error("Could not fetch products:", error);
    const productsGridElement = document.querySelector(".js-products-grid");
    if (productsGridElement) {
      productsGridElement.innerHTML =
        '<p class="error-message">Could not load products. Please try again later.</p>';
    }
  }
}

function renderProductsGrid(productsToDisplay) {
  let productsHTML = "";
  if (productsToDisplay.length === 0) {
    productsHTML =
      '<p class="no-products-found">No products match your search.</p>';
  } else {
    productsToDisplay.forEach((product) => {
      let priceHTML = "";
      let discountBadgeHTML = "";
      // currentPriceCents is not strictly needed here anymore if addToCart uses getProduct from products.js for price

      if (product.discountPercent && product.discountPercent > 0) {
        const discountAmount = Math.round(
          product.priceCents * (product.discountPercent / 100)
        );
        const discountedPriceCents = product.priceCents - discountAmount;

        priceHTML = `
          <div class="product-price-original">
            <s>$${(product.priceCents / 100).toFixed(2)}</s>
          </div>
          <div class="product-price-discounted">
            $${(discountedPriceCents / 100).toFixed(2)}
          </div>
        `;
        discountBadgeHTML = `<div class="discount-badge">${product.discountPercent}% off</div>`;
      } else {
        priceHTML = `
          <div class="product-price">
            $${(product.priceCents / 100).toFixed(2)}
          </div>
        `;
      }

      productsHTML += `
        <div class="product-container">
          ${discountBadgeHTML}
          <div class="product-image-container">
            <img class="product-image" src="./${product.image}" />
          </div>
          <div class="product-name limit-text-to-2-lines">${product.name}</div>
          <div class="product-rating-container">
            <img class="product-rating-stars" src="images/ratings/rating-${
              product.rating.stars * 10
            }.png" />
            <div class="product-rating-count link-primary">${
              product.rating.count
            }</div>
          </div>
          ${priceHTML}
          <div class="product-quantity-container">
            <select class="js-quantity-selector-${product.id}">
              <option selected value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>
          <div class="product-spacer"></div>
          <div class="added-to-cart js-added-to-cart-${product.id}">
            <img src="images/icons/checkmark.png" />
            Added
          </div>
          <button class="add-to-cart-button button-primary js-add-to-cart" data-product-id="${
            product.id
          }">
            Add to Cart
          </button>
        </div>
      `;
    });
  }
  productsGridElement.innerHTML = productsHTML;
  // Re-attach event listeners for dynamically created add-to-cart buttons
  attachAddToCartListeners();
}

function updateCartQuantityDisplay() {
  const cartQuantity = calculateCartQuantity();
  const cartQuantityElement = document.querySelector(".js-cart-quantity");
  if (cartQuantityElement) {
    // Check if element exists (it might not on all pages)
    cartQuantityElement.innerHTML = cartQuantity > 0 ? cartQuantity : 0;
  }
}

// Function to attach listeners to all .js-add-to-cart buttons
function attachAddToCartListeners() {
  document.querySelectorAll(".js-add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const { productId } = button.dataset;
      const quantitySelector = document.querySelector(
        `.js-quantity-selector-${productId}`
      );
      const quantity = Number(quantitySelector.value);
      addToCart(productId, quantity); // addToCart now handles getting the correct price
      updateCartQuantityDisplay();

      const addedMessage = document.querySelector(
        `.js-added-to-cart-${productId}`
      );
      if (addedMessage) {
        addedMessage.classList.add("added-to-cart-visible");

        const existingTimeoutId = Number(addedMessage.dataset.timeoutId);
        if (existingTimeoutId) {
          clearTimeout(existingTimeoutId);
        }
        const timeoutId = setTimeout(() => {
          addedMessage.classList.remove("added-to-cart-visible");
          delete addedMessage.dataset.timeoutId;
        }, 2000);
        addedMessage.dataset.timeoutId = timeoutId.toString();
      }
    });
  });
}

function performSearch() {
  const searchTerm = searchBarElement.value.trim().toLowerCase();
  if (searchTerm === "") {
    renderProductsGrid(products); // Show all if search is empty
  } else {
    const filteredProducts = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm);
      const keywordMatch = product.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchTerm)
      );
      return nameMatch || keywordMatch;
    });
    renderProductsGrid(filteredProducts);
  }
}

// Initial setup
if (productsGridElement) {
  fetchProducts(); // Fetch products from backend and then render
} else {
  console.warn(
    ".js-products-grid not found on this page. Skipping product rendering."
  );
}

if (searchButtonElement) {
  searchButtonElement.addEventListener("click", performSearch);
} else {
  console.warn(
    ".search-button not found on this page. Search will not work via button."
  );
}

if (searchBarElement) {
  searchBarElement.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });
  // Optional: search as user types
  // searchBarElement.addEventListener("input", performSearch);
} else {
  console.warn(
    ".search-bar not found on this page. Search will not work via input."
  );
}

updateCartQuantityDisplay();
