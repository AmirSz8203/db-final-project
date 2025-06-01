import { getCart, calculateCartQuantity, resetCart } from "../../data/cart.js";
import { getProduct } from "../../data/products.js";
import { getDeliveryOption } from "../../data/deliveryOptions.js";
import { formatCurrency } from "../utils/money.js";
import { addOrder } from "../../data/orders.js";

export function renderPaymentSummary() {
  let productPriceCents = 0;
  let shippingPriceCents = 0;
  const currentCart = getCart(); // Get a snapshot of the cart for this order

  if (currentCart.length === 0) {
    // Optionally, display a message or disable the place order button
    // For now, we'll just ensure totals are zero and button might not do much.
  }

  currentCart.forEach((cartItem) => {
    // const product = getProduct(cartItem.productId); // We no longer need full product details here for price
    // productPriceCents += product.priceCents * cartItem.quantity;

    // Use the price stored in the cart item itself
    if (cartItem.priceWhenAddedCents !== undefined) {
      productPriceCents += cartItem.priceWhenAddedCents * cartItem.quantity;
    } else {
      // Fallback or error handling if priceWhenAddedCents is missing
      // This might happen for carts stored before this change, though initializeCartWithPrices should handle it.
      console.warn(
        "Cart item missing priceWhenAddedCents, attempting fallback:",
        cartItem
      );
      const productInfo = getProduct(cartItem.productId);
      if (productInfo) {
        productPriceCents +=
          productInfo.effectivePriceCents * cartItem.quantity;
      } else {
        console.error(
          "Cannot calculate price for cart item, product not found:",
          cartItem.productId
        );
      }
    }

    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    shippingPriceCents += deliveryOption.priceCents;
  });

  const totalBeforeTaxCents = productPriceCents + shippingPriceCents;
  const taxCents = totalBeforeTaxCents * 0.1;
  const totalCents = totalBeforeTaxCents + taxCents;

  // Calculate cart quantity based on the cart at the moment of rendering payment summary
  const currentRenderCartQuantity = currentCart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const paymentSummaryHTML = `
      <div class="payment-summary-title">Order Summary</div>
      
      <div class="payment-summary-row">
        <div>Items (${currentRenderCartQuantity}):</div>
        <div class="payment-summary-money">$${formatCurrency(
          productPriceCents
        )}</div>
      </div>

      <div class="payment-summary-row">
        <div>Shipping &amp; handling:</div>
        <div class="payment-summary-money">
          $${formatCurrency(shippingPriceCents)}
        </div>
      </div>

      <div class="payment-summary-row subtotal-row">
        <div>Total before tax:</div>
        <div class="payment-summary-money">
          $${formatCurrency(totalBeforeTaxCents)}
        </div>
      </div>

      <div class="payment-summary-row">
        <div>Estimated tax (10%):</div>
        <div class="payment-summary-money">
          $${formatCurrency(taxCents)}
        </div>
      </div>

      <div class="payment-summary-row total-row">
        <div>Order total:</div>
        <div class="payment-summary-money">
          $${formatCurrency(totalCents)}
        </div>
      </div>

      <button class="place-order-button button-primary js-place-order">
        Place your order
      </button>
    `;
  document.querySelector(".js-payment-summary").innerHTML = paymentSummaryHTML;

  const placeOrderButton = document.querySelector(".js-place-order");
  if (placeOrderButton) {
    console.log(
      "Attaching click listener to place order button.",
      placeOrderButton
    );
    placeOrderButton.addEventListener("click", () => {
      console.log("Place order button clicked.");
      console.log("Current cart for order:", currentCart);
      if (currentCart.length === 0) {
        console.log("Cart is empty, showing alert.");
        alert("Your cart is empty. Please add items before placing an order.");
        return;
      }
      const newOrder = {
        id: Date.now().toString(), // Simple unique ID
        orderTime: new Date().toISOString(),
        items: currentCart, // Use the snapshot of the cart
        totalAmountCents: totalCents, // Save the calculated total
      };
      console.log("New order created:", newOrder);

      addOrder(newOrder);
      resetCart();
      console.log("Redirecting to orders.html");
      window.location.href = "orders.html";
    });
  } else {
    console.error(
      ".js-place-order button not found when trying to attach listener."
    );
  }
}
