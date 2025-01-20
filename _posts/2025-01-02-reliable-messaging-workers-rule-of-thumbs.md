---
title: Reliable Messaging Workers - Rule of Thumbs
excerpt: In distributed systems, messaging workers are the backbone of asynchronous processing, ensuring web servers can respond to clients promptly. But what happens when things go wrong? From awkward database states during third-party downtime to lost messages and manual recovery efforts, unreliable workers can lead to endless firefighting. This post explores practical tips and rule-of-thumb properties for designing reliable messaging workers. Inspired by my experience with Xendit teams, these strategies have resulted in nearly zero message issues, happier developers, and no more manual fixes.

categories: software-engineering
tags: 
    - software-architecture
    - backend 
mermaid: true
image: "/docs/2025-01-02-reliable-messaging-workers-rule-of-thumbs/thumbnail.png"
minutes_read: 7
---

![Reliable Messaging Worker Illustration](/docs/2025-01-02-reliable-messaging-workers-rule-of-thumbs/illustration.webp)

In distributed systems, especially with messaging patterns, workers often operate in the background, ensuring web servers can respond to clients without delay. But here's the real question:  

> What happens when things go wrong❓❓

Here are some common pain points:

- 💾 Awkward database states during third-party downtime.
- 🛑 Lost messages when consumption fails.
- 🔧 Manual recovery efforts, like updating records and retrying third-party calls.


Think of workers as a courier service 📦 : a great courier doesn’t just drop off packages and hope for the best. They ensure every delivery is successful, retry if there’s an issue, and notify you when something goes wrong. Reliable workers follow the same principles—ensuring every message is handled, even in the face of failure.

In this post, I’ll share the rule of thumbs and practical tips I’ve used with Xendit teams to build dependable workers. The result?

- ✅ Nearly zero message issues.
- 🔥 No more firefighting stuck processes manually.
- 🎉 Happier developers.

Want to level up your messaging workers? Let’s dive in! 🚀
---

* toc
{:toc}

---

# Critical Properties for Reliable Messaging Workers
## 1. Traceable and Observable

![Pikachu Observe](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExazdqdGtuanRsdDA2YjY1M2w1bXB4eTg2MXo1dWY3Z3puenVtY2c1biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NS7gPxeumewkWDOIxi/giphy.gif)

Imagine debugging a worker issue without any logs and traces. Sounds like a nightmare, right? 

### Rule of Thumb
- Observable: Able to monitor the distributed systems
- Traceable: Able to pinpoint the exact failure point.

#### Observable
Logs and Traces is your system's flashlight in the dark. It allows you to monitor and debug distributed architectures with ease.

#### Traceable
Consider a distributed payment system where transactions fail sporadically. Using tools like [OpenTelemetry](https://opentelemetry.io/) and setting up structured logging can help trace the issue from the API gateway to the database, pinpointing the exact failure point.

---

## 2. Durable Failed Messages

Not all messages are processed perfectly on the first try. That’s okay—we can retry the message consumption sometimes later when the systems is already healthy again. Just make sure we don't lose the messages yet!

![Recycle bin](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGx5NWdtbHQ1ZW8xaW1md2VhZ2g3ZXR5b3FoY3hxNzN1dGFscGVwciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKJr0rcnn2TswAU/giphy.gif)
<p align="center">
Just like recycle bin / trash folder in your OS, we shouldn't really delete those failed messages permanently (yet).
</p>

### Rule of Thumb

- Failed messages must be persisted.
- Failed messages should be easily retrievable for retries.

### Practical Example

An order service processes orders from a queue. If an order fails due to an external API timeout (3rd party provider), persisting the failed message in a dead-letter queue allows the system to retry it later, avoiding stuck/phantom state of order.

<pre class="mermaid">
sequenceDiagram
    participant Service as Web Service
    participant Queue as Message Queue
    participant Worker as Order Processing Worker
    participant DB as Database
    participant TPS as 3rd Party Provider
    participant DLQ as Dead Letter Queue

    Service->>Queue: "Place Order (by ID and status=CREATED)"
    Queue->>Worker: Consume Message
    %% note right of Worker: If order status is not CREATED,<br />we should skip the message
    Worker->>DB: Validate Order (by ID and status==CREATED)
    Worker--xTPS: Payment Request Failure
    Worker->>Queue: Give NACK<br/>(negative acknowledgement)
    Queue -->> DLQ: Forward Failed Messages
</pre>

### Dead Letter Queue Implementations

Most Message Queue already support this feature out-of-the-box:
- RabbitMQ - [Dead Letter Exchange](https://www.rabbitmq.com/docs/dlx)
- Amazon SQS - Message will be forwarded to dead letter queue when it has reached `maxReceiveCount` (maximum retry count). Read more: [Dead Letter Queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- Apache Kafka - It doesn't support dead letter pattern `out of the box`, as kafka works with principle of `dumb broker, smart consumers`. There are several workarounds or patterns to handle it in consumer level, see here: [Error Handling via Dead Letter Queue in Apache Kafka](https://www.kai-waehner.de/blog/2022/05/30/error-handling-via-dead-letter-queue-in-apache-kafka/)

### NACK Implementation (Negative Acknowledgement)
`NACK` implementation can vary on different message queue/brokers.

- In RabbitMQ, we can leverage `basic.reject` or `basic.nack` methods. However, it doesn't support delay, we might need to add delay in consumer level instead. Read more: [RabbitMQ Unprocessable Deliveries](https://www.rabbitmq.com/docs/reliability#unprocessable-deliveries)
- In Amazon SQS, there's no such thing as `NACK`. We just don't do anything and let the message `visibility timeout` expires. If we want to introduce `delay` on the message, we need to change the `visibility timeout` using [ChangeMessageVisibility API](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ChangeMessageVisibility.html)
- In Kafka, there's no such thing as `NACK`, it's either the Consumer process the message (by perform `commit`) or you die! (Read more: [Confluent - Error handling Patterns in Kafka](https://www.confluent.io/blog/error-handling-patterns-in-kafka/))

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
    Worker->>DB: Validate Order (by ID and status==CREATED)
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

### Rule of Thumb

> Messages shouldn't have side effects when being processed more than once.

Strategies to achieve idempotency include:

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

### Practical Example: Using combination of **ID-based** and **state-based** solutions

Let's use the same example as previous property. Order status has been updated `PAYMENT_REQUESTED`. For some unknown reasons, the message broker/queue **redeliver** the same message to the worker. The worker will validate the order status to the database, and will only process if the status is `ACCEPTED`. In this case, the order status is `PAYMENT_REQUESTED`, so we will just skip the message.

> To discuss on how possibly this can happen is very broad topic, but the scenario exists in real world (at least in my own experience). We'll let it slide for now...

<pre class="mermaid">
sequenceDiagram
    participant Queue as Message Queue<br/>(or Dead Letter Queue)
    participant Worker as Order Processing Worker
    participant DB as Database

    Queue->>Worker: Consume [duplicate] Message
    Note right of Worker: Order status hasn't been changed yet
    Worker->>DB: Validate Order (by ID and status==CREATED)
    DB-->>Worker: return Order (status=PAYMENT_REQUESTED)
    Note left of Worker: Order status is invalid,<br/>we will skip this message
    Worker->>Queue: Give ACK
</pre>

---

## 5. Resilient

![Resilient Boxer](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXhwMzV4ZGhhajMzNHdpMzdsZnFwN3VvZzl4OGpua2p3OW5zdzNpdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Uni5k1O6p5RCHVIM2j/giphy.gif)

A resilient worker is like a boxer who keeps getting up after every punch! Automatic retries and fallback mechanisms are critical to support resiliency properties.

### Rule of Thumb

Workers should:

- Implement retry mechanisms.
- Use circuit breakers to prevent overwhelming downstream services during failures.

#### Retry mechanisms

Retrying message consumption is the most trivial solution to any failed message consumption, when your worker's already implemented above properties: Recoverable and Idempotent.

The common retry mechanism is Exponential backoff (at least for my experience), in which a client periodically retries a failed request with increasing delays between requests, hoping to give the dependencies enough buffer time to recover.

Read more: [Overcoming the Retry Dilemma in Distributed Systems](https://dzone.com/articles/overcoming-the-retry-dilemma-in-distributed-systems)

#### Circuit Breaker
> The basic idea behind the circuit breaker is very simple. You wrap a protected function call in a circuit breaker object, which monitors for failures. Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all. Usually you'll also want some kind of monitor alert if the circuit breaker trips.

Read more on circuit breaker Pattern here: [Circuit Breaker by Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)

### Practical Example

We leverage what we already designed in previous properties, with more automated way to retry the failure. We won't forward failed messages directly to dead-letter queue, but we will do `NACK` (negative acknowledgment) to message broker, meaning we reject the message consumption. Only when we have reached max retry attempt, yet the message consumptions still failing, we forward the messages to dead letter queue.

<pre class="mermaid">
sequenceDiagram
    participant Queue as Message Queue
    participant Worker as Order Processing Worker
    participant DB as Database
    participant TPS as 3rd Party Provider

    Queue->>Worker: Consume Message
    %% note right of Worker: If order status is not CREATED,<br />we should skip the message
    Worker->>DB: Validate Order (by ID and status==CREATED)
    Worker--xTPS: Payment Request Failure
    Worker->>Queue: Give NACK (retry_count=1)

    note right of Queue: first retry attempt
    Queue->>Worker: Consume Message <br/>(delay=1s retry_count=1)
    %% note right of Worker: If order status is not CREATED,<br />we should skip the message
    Worker->>DB: Validate Order (by ID and status==CREATED)
    Worker--xTPS: Payment Request Failure
    Worker->>Worker: [threshold reached]<br/>Circuit breaker switched to OPEN
    Worker->>Queue: Give NACK (retry_count=1)

    note right of Queue: second retry attempt
    Queue->>Worker: Consume Message <br/>(delay=2s retry_count=1)
    %% note right of Worker: If order status is not CREATED,<br />we should skip the message
    Worker->>DB: Validate Order (by ID and status==CREATED)
    Worker-xWorker: Circuit breaker status is OPEN<br/>wont call 3rd party API
    Worker->>Queue: Give NACK (retry_count=1)

    note right of Queue: ....<br/>after X retry attempt<br/>(max delay=10s)<br/>circuit breaker timeout reached
    Queue->>Worker: Consume [failed] Message
    Note right of Worker: Order status hasn't been changed yet
    Worker->>DB: Validate Order (by ID and status==CREATED)
    Worker->>Worker: Circuit breaker switched to HALF_OPEN (timeout reached)
    Worker-->>TPS: Payment Request Success
    Worker->>Worker: Circuit breaker switched to CLOSED
    Worker->>DB: Update Order (status=PAYMENT_REQUESTED)
    Note left of Worker: for next business processes
    Worker-->>Queue: Publish message<br/>Order.PAYMENT_REQUESTED
    Worker->>Queue: Give ACK
</pre>

---


## 6. Modular

Complex systems need simplicity at their core. Modular workers are easier to debug, maintain, and scale.

### Rule of Thumb:

Workers should stick to a single responsibility principle. Maintainability is very biased opinion, but based on my experience with Xendit's teams, a single worker should only:

- Make **at most one state-changing request** to another service (e.g., creating a transaction).
- Perform **at most one state-changing database operation** (e.g., wrapping multiple table updates in a single DB transaction).
- [if needed] Publish **one event** to notify subsequent workers.
- [if needed] Execute as many read operations as needed to support state-changing actions.

Violating those rule of thumbs will make error handling in single worker become messy--it's a sign to breaking down the processes into separate workers. You can leverage saga pattern in such cases, Read more on my writing: [Avoid Manual Reconciliation, Solve Stuck Systems Flow using Saga Pattern](https://zhorifiandi.github.io/software-engineering/2024/09/14/solve-stuck-systems-flow-using-saga-pattern.html)

### Practical Example

Just like previous examples, the `Order Processing Worker` satisfy the rule of thumb
- **at most one state-changing request** to another service: Calling Third Party API for Payment Request
- **at most one state-changing database operation**: Update the Order status to `PAYMENT_REQUESTED`
 - Publish Order message with status: `PAYMENT_REQUESTED`
 - Perform read to database to validate order status


---

# Summary

| **No** | **Property** | **Description** | **Key Techniques** |
| --- | --- | --- | --- |
| 1 | Traceable and Observable | Monitor and debug system behavior across services. | Structured logging, distributed tracing (e.g., OpenTelemetry). |
| 2 | Recoverable | Handle failures gracefully and recover automatically. | Automatic reconnections, message replay. |
| 3 | Durable Failed Message | Ensure failed messages are not lost and can be retried. | Dead-letter queues, persistent storage for failed messages. |
| 4 | Idempotent | Safely repeat tasks without inconsistent results. | ID-based tracking, state-based checks, database locks, distributed locks. |
| 5 | Resilient | Continue functioning during partial failures. | Retry Mechanism, circuit breakers. |
| 6 | Modular | Simplify and maintain single responsibility for each worker. | Single state-changing operation, saga pattern |

# Conclusion

By building workers with traceable, recoverable, durable, modular, idempotent, and resilient attributes, you ensure a robust and maintainable system. This approach also guarantees scalability for distributed architectures. These attributes aren’t just nice-to-haves—they’re essential for surviving in the wild world of distributed systems. Happy refactoring!
