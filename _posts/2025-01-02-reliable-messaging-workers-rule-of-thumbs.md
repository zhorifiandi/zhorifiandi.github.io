---
title: Reliable Messaging Workers - Rule of Thumbs
excerpt: In the realm of distributed systems, especially when working with messaging patterns, workers play a crucial role. These unsung heroes handle messages from queues or brokers, ensuring tasks are executed seamlessly. But what happens when things go awry? Workers must be resilient, fault-tolerant, and reliable. This post dives into the essential properties every reliable worker should have, sprinkled with practical tips to keep your system humming. (Don’t worry, I have applied these rule of thumbs in several Xendit teams (and services), and we had almost zero issues, and make developers life happy!)
categories: software-engineering
tags: 
    - software-architecture
    - backend 
mermaid: true
image: "/docs/2025-01-02-reliable-messaging-workers-rule-of-thumbs/thumbnail.png"
minutes_read: 7
---

![Reliable Messaging Worker Illustration](/docs/2025-01-02-reliable-messaging-workers-rule-of-thumbs/illustration.webp)

In the realm of distributed systems, especially when working with messaging patterns, workers play a crucial role. These unsung heroes handle messages from queues or brokers, ensuring tasks are executed seamlessly. But what happens when things go awry? Workers must be resilient, fault-tolerant, and reliable. This post dives into the essential properties every reliable worker should have, sprinkled with practical tips to keep your system humming. (Don’t worry, I have applied these rule of thumbs in several Xendit teams (and services), and we had almost zero issues, and make developers life happy!)

---

# Critical Properties for Reliable Messaging Workers

---

* toc
{:toc}

---

## 1. Traceable and Observable

![Pikachu Observe](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExazdqdGtuanRsdDA2YjY1M2w1bXB4eTg2MXo1dWY3Z3puenVtY2c1biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NS7gPxeumewkWDOIxi/giphy.gif)

Imagine debugging a worker issue without any logs. Sounds like a nightmare, right? Observability is your system's flashlight in the dark. It allows you to monitor and debug distributed architectures with ease.

### Rule of Thumb:

#### Workers need end-to-end traceability to ensure smooth operations. 
Logs and distributed tracing are essential for tracking execution and identifying issues across services. Consider a distributed payment system where transactions fail sporadically. Using tools like [OpenTelemetry](https://opentelemetry.io/) and setting up structured logging can help trace the issue from the API gateway to the database, pinpointing the exact failure point.

---

## 2. Durable Failed Messages

Not all messages are processed perfectly on the first try. That’s okay—we can retry the message consumption sometimes later when the systems is already healthy again. Just make sure we don't lose the messages yet!

![Recycle bin](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGx5NWdtbHQ1ZW8xaW1md2VhZ2g3ZXR5b3FoY3hxNzN1dGFscGVwciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKJr0rcnn2TswAU/giphy.gif)
<p align="center">
*Just like recycle bin / trash folder in your OS, we don't really delete it permanently (yet).*
</p>

### Rule of Thumb:

- Failed messages must be persisted.
- Failed messages should be easily retrievable for retries.

### Practical Example:

An order service processes orders from a queue. If an order fails due to an external API timeout (3rd party provider), persisting the failed message in a dead-letter queue allows the system to retry it later, avoiding stuck/phantom state of order.

<pre class="mermaid">
sequenceDiagram
    participant Service as Web Service
    participant Queue as Message Queue
    participant Worker as Order Processing Worker
    participant DB as Database
    participant TPS as 3rd Party Provider
    participant DLQ as Dead Letter Queue

    Service->>Queue: "Place Order (status=CREATED)"
    Queue->>Worker: Consume Message
    %% note right of Worker: If order status is not CREATED,<br />we should skip the message
    Worker->>DB: Validate Order (status==CREATED)
    Worker--xTPS: Payment Request Failure
    Worker->>Queue: Give NACK<br/>(negative acknowledgement)
    Queue -->> DLQ: Forward Failed Messages
</pre>

Most Message Queue already support this feature out-of-the-box:
- RabbitMQ - [Dead Letter Exchange](https://www.rabbitmq.com/docs/dlx)
- Amazon SQS - [Dead Letter Queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) 
- Apache Kafka - It doesn't support dead letter pattern `out of the box`, as kafka works with principle of `dumb broker, smart consumers`. There are several workarounds or patterns to handle it in consumer level, see here: [Error Handling via Dead Letter Queue in Apache Kafka](https://www.kai-waehner.de/blog/2022/05/30/error-handling-via-dead-letter-queue-in-apache-kafka/)

---

## 3. Recoverable

Failures are inevitable, but recovering gracefully sets reliable systems apart. Whether it’s a network hiccup in your third party API or a message broker outage, your worker shouldn’t just give up. 

### Rule of Thumb
- Replayable Message: Replaying messages should recover processes without requiring manual interventions 
- Recoverable Consumer: Workers must automatically reconnect to the message broker after losing connection to prevent idling.

#### Replayable Message: Replaying messages should recover processes without requiring manual interventions 
> Requiring manual interventions example: manually updating transaction statuses.

Let's use the same example. Then, in next reprocessing (within the same worker), the message will be successfully processed when 3rd Party Provider becomes healthy. In this case, the worker will automatically update the order status to `PAYMENT_REQUESTED`

<pre class="mermaid">
sequenceDiagram
    participant Queue as Message Queue<br/>(or Dead Letter Queue)
    participant Worker as Order Processing Worker
    participant DB as Database
    participant TPS as 3rd Party Provider

    Queue->>Worker: Consume [failed] Message
    Note right of Worker: Order status hasn't been changed yet
    Worker->>DB: Validate Order (status==CREATED)
    Worker-->>TPS: Payment Request Success
    Worker->>DB: Update Order (status=PAYMENT_REQUESTED)
    Note left of Worker: for next business processes
    Worker-->>Queue: Publish message<br/>Order.PAYMENT_REQUESTED
    Worker->>Queue: Give ACK
</pre>


#### Recoverable Consumer: Workers must automatically reconnect to the message broker after losing connection to prevent idling.

Some client libraries might already handle this out-of-the-box. However, note that there are also some client libraries for specific programming language, that might not support auto reconnection. (Cherry pick example: [RabbitMQ for Go which don't support auto reconnection](https://github.com/rabbitmq/amqp091-go?tab=readme-ov-file#non-goals)). Please double check your client library documentation. In such case, you might need to handle it by your self.

---

## 4. Idempotent

Reprocessing the same message shouldn’t create chaos. Idempotency ensures repeated tasks don’t cause inconsistent states.

### Rule of Thumb:

Messages with the same ID should be processed without side effects. Strategies to achieve idempotency include:

| **Strategy** | **Main Idea** |
| --- | --- |
| ID-based | Annotate processed messages by their ID. |
| State-based | Use message states to track processing progress. |
| Hash-based | Store a hash of each message to detect duplicates. |
| Database Lock | Prevent concurrent processes using DB-level locks. |
| Distributed Lock | Scale locking mechanisms for distributed systems. |

### Recommendations:

1. Prefer **ID-based** or **state-based** solutions when possible.
2. Use **hash-based** solutions for non-unique messages (cautiously).
3. Apply **DB locks** or **distributed locks** to prevent race conditions in high-concurrency scenarios.

### Practical Example:

A payment worker processing duplicate refund requests can use a state-based check to skip already completed refunds, ensuring consistent behavior without overwriting previous results.

---

## 5. Resilient

![Resilient Boxer](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXhwMzV4ZGhhajMzNHdpMzdsZnFwN3VvZzl4OGpua2p3OW5zdzNpdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Uni5k1O6p5RCHVIM2j/giphy.gif)

A resilient worker is like a boxer who keeps getting up after every punch! Automatic retries and fallback mechanisms are critical to support resiliency properties.

### Rule of Thumb:

Workers should:

- Implement exponential backoff retry mechanisms.
- Use circuit breakers to prevent overwhelming downstream services during failures.

### Practical Example:

Imagine a data ingestion pipeline where a worker fetches data from an unstable third-party API. Using exponential backoff retries ensures the worker doesn’t overload the API, while circuit breakers prevent cascading failures to dependent services.

---


## 6. Modular

Complex systems need simplicity at their core. Modular workers are easier to debug, maintain, and scale.

### Rule of Thumb:

Workers should stick to a single responsibility principle. A worker can:

- Make **one state-changing request** to another service (e.g., creating a transaction).
- Perform **one state-changing database operation** (e.g., wrapping multiple table updates in a single DB transaction).
- Publish **one event** to notify subsequent workers.
- Execute as many read operations as needed to support state-changing actions.

### Practical Example:

A refund worker in an e-commerce system might:

1. Update the payment state in the database (e.g., from "PENDING" to "REFUNDED").
2. Notify downstream services like inventory or customer notification systems.
3. Publish an event for further analytics.

---

# Summary

| **Property** | **Description** | **Key Techniques** |
| --- | --- | --- |
| Traceable and Observable | Monitor and debug system behavior across services. | Structured logging, distributed tracing (e.g., OpenTelemetry). |
| Recoverable | Handle failures gracefully and recover automatically. | Automatic reconnections, message replay. |
| Durable Failed Message | Ensure failed messages are not lost and can be retried. | Dead-letter queues, persistent storage for failed messages. |
| Idempotent | Safely repeat tasks without inconsistent results. | ID-based tracking, state-based checks, database locks, distributed locks. |
| Resilient | Continue functioning during partial failures. | Exponential backoff, circuit breakers. |
| Modular | Simplify and maintain single responsibility for each worker. | Single state-changing operation, modular architecture. |

# Conclusion

By building workers with traceable, recoverable, durable, modular, idempotent, and resilient attributes, you ensure a robust and maintainable system. This approach also guarantees scalability for distributed architectures. These attributes aren’t just nice-to-haves—they’re essential for surviving in the wild world of distributed systems. Happy refactoring!
