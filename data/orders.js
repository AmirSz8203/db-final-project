export function getOrders() {
  const ordersString = localStorage.getItem("orders");
  console.log("localStorage orders string:", ordersString);
  const orders = JSON.parse(ordersString) || [];
  console.log("Parsed orders from localStorage:", orders);
  return orders;
}

function saveOrders(orders) {
  console.log("Saving orders to localStorage:", orders);
  localStorage.setItem("orders", JSON.stringify(orders));
}

export function addOrder(order) {
  console.log("addOrder called with:", order);
  const orders = getOrders();
  orders.unshift(order); // Add to the beginning to show newest first
  saveOrders(orders);
  console.log("Order added, all orders now:", orders);
}
