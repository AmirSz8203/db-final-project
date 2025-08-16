const API_BASE_URL = 'http://localhost:8000';

export async function addOrder(order) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('You must be logged in to place an order.');
    window.location.href = 'login.html';
    return;
  }

  // Transform the frontend order object to match the backend's OrderCreate model
  const orderDataForBackend = {
    items: order.items.map(item => {
      // Ensure we have the necessary fields. Fallbacks might be needed for older cart data.
      const priceCents = item.priceWhenAddedCents;
      if (priceCents === undefined) {
        console.error('Cannot place order: item in cart is missing price information.', item);
        // This should ideally not happen if the cart is managed correctly.
        // As a robust solution is complex, we'll stop this order from proceeding.
        throw new Error('An item in your cart is missing price information.');
      }
      return {
        product_id: item.productId,
        quantity: item.quantity,
        price_cents: priceCents
      };
    })
  };

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderDataForBackend)
    });

    if (response.ok) {
      console.log('Order placed successfully!');
      // The calling function in paymentSummary.js handles cart reset and redirection.
      return await response.json();
    } else {
      const errorData = await response.json();
      console.error('Failed to place order:', errorData);
      alert(`Could not place your order. Server said: ${errorData.detail || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.error('Error placing order:', error);
    alert('An error occurred while placing your order. Please check your connection and try again.');
    return null;
  }
}
