import crypto from 'crypto';

function createOrderCreatedEvent(orderId: string, amount: number, source: string | null = "orders-service") {
    return {
        id: crypto.randomUUID(),
        source,
        type: "OrderCreated",
        time: new Date().toISOString(),
        data: { orderId, amount }
      }
}