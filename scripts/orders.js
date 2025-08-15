import { formatCurrency } from './utils/money.js';
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";

async function fetchOrders() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        // Already handled by the inline script in orders.html, but as a fallback
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const orders = await response.json();
            renderOrders(orders);
        } else {
            console.error('Failed to fetch orders');
            document.querySelector('.orders-grid').innerHTML = '<p>Could not load your orders.</p>';
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        document.querySelector('.orders-grid').innerHTML = '<p>An error occurred while loading your orders.</p>';
    }
}

async function renderOrders(orders) {
    const ordersGrid = document.querySelector('.orders-grid');
    if (orders.length === 0) {
        ordersGrid.innerHTML = '<p>You have no past orders.</p>';
        return;
    }

    let ordersHTML = '';
    for (const order of orders) {
        const orderTime = dayjs(order.order_date);

        ordersHTML += `
            <div class="order-container">
                <div class="order-header">
                    <div class="order-header-left-section">
                        <div class="order-date">
                            <div class="order-header-label">Order Placed:</div>
                            <div>${orderTime.format('MMMM D, YYYY')}</div>
                        </div>
                        <div class="order-total">
                            <div class="order-header-label">Total:</div>
                            <div>$${formatCurrency(order.total_price_cents)}</div>
                        </div>
                    </div>
                    <div class="order-header-right-section">
                        <div class="order-header-label">Order ID:</div>
                        <div>${order.id}</div>
                    </div>
                </div>
                <div class="order-details-grid">
        `;

        for (const item of order.items) {
            // We need to fetch product details for each item
            const product = await getProduct(item.product_id);
            if (!product) continue;

            ordersHTML += `
                <div class="product-image-container">
                    <img src="${product.image}">
                </div>
                <div class="product-details">
                    <div class="product-name">${product.name}</div>
                    <div class="product-delivery-date">Arriving on: Not implemented</div>
                    <div class="product-quantity">Quantity: ${item.quantity}</div>
                    <button class="buy-again-button button-primary">
                        <img class="buy-again-icon" src="images/icons/buy-again.png">
                        <span class="buy-again-message">Buy it again</span>
                    </button>
                </div>
                <div class="product-actions">
                    <a href="tracking.html?orderId=${order.id}&productId=${product.id}">
                        <button class="track-package-button button-secondary">Track package</button>
                    </a>
                </div>
            `;
        }

        ordersHTML += `
                </div>
            </div>
        `;
    }

    ordersGrid.innerHTML = ordersHTML;
}

async function getProduct(productId) {
    try {
        const response = await fetch(`/products/${productId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', fetchOrders);
