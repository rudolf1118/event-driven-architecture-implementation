
/*
const bus = new EventBus();

bus.subscribe("OrderCreated", (evt) => console.log("A", evt));
bus.subscribe("OrderCreated", (evt) => console.log("B", evt));
bus.subscribe("UserRegistered", (evt) => console.log("C", evt));
*/

interface IEvent {
  type: string,
  id: string,
  time: string,
  source: string,
  message: {
    date: Date,
    uuid: string,
    data: any[]
  }
}

export class EventBus {
  private handlers: Map<string, Function[]>;

  constructor() {
    this.handlers = new Map();
  }

  private validateEvent(event: IEvent) {
    if (!event || typeof event.type !== "string" || event.type.trim() === "") {
      throw new Error("Invalid event");
    }    
  }

  // [handler1, handler2, handler3] handler2
  private filterToPush(eventType: string, handler: Function, action: "Add" | "Delete"): void {
    if (!handler) return ;
    const handlersInQueue = this.handlers.get(eventType) ?? [];
    switch (action) {
        case "Add":
          for (const h of handlersInQueue ){
            if (h === handler) return ;
          }
          handlersInQueue.push(handler);
          break;
        case "Delete":
          let newQueue: Function[] = [];
          for (const h of handlersInQueue ){
              if (h !== handler) newQueue.push(h);
          }
          this.handlers.set(eventType, newQueue);
          break;
    }
  }

  public subscribe(eventType: string, handler: Function) {
    const existed = this.handlers.get(eventType);
    if (!existed) {
      this.handlers.set(eventType, []);
    }
    this.filterToPush(eventType, handler, "Add");
    console.log(this.handlers)
    return () => {
      this.filterToPush(eventType, handler, "Delete");
    }
  }
  
  async publish(event: IEvent): Promise<void> {
    this.validateEvent(event);
  
    const subs = this.handlers.get(event.type);
    if (!subs || subs.length === 0) return;
  
    const tasks = subs.map((handler) => Promise.resolve().then(() => handler(event)));
    const results = await Promise.allSettled(tasks);
    results.forEach((r) => {
      if (r.status === "rejected") console.error(r.reason);
    });
  }
  
}

/** Producer: event factory */
function createOrderCreatedEvent(orderId: string, amount: number): IEvent {
  return {
    id: crypto.randomUUID(),
    type: "OrderCreated",
    time: new Date().toISOString(),
    source: "orders-service",
    message: {
      date: new Date(),
      uuid: orderId,
      data: [{ amount }],
    },
  };
}

/** Use case: create order -> publish event */
async function createOrder(bus: EventBus, orderId: string, amount: number) {
  console.log("[ORDERS] created order:", orderId);

  const event = createOrderCreatedEvent(orderId, amount);
  await bus.publish(event);

  console.log("[ORDERS] flow finished for:", orderId);
}

/** Demo */
async function main() {
  const bus = new EventBus();

  // consumer #1
  bus.subscribe("OrderCreated", async (event: IEvent) => {
    console.log("[EMAIL] send confirmation for", event.message.uuid);
  });

  // consumer #2
  bus.subscribe("OrderCreated", (event: IEvent) => {
    console.log("[ANALYTICS] track order", event.message.uuid);
  });

  // consumer #3 (broken on purpose)
  bus.subscribe("OrderCreated", () => {
    throw new Error("SMTP is down");
  });

  await createOrder(bus, "order-123", 100);
}

main().catch((e) => console.error("Fatal:", e));