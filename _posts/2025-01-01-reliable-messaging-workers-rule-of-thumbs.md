---
title: Reliable Messaging Workers - Rule of Thumbs
excerpt: In the realm of distributed systems, especially when working with messaging patterns, workers play a crucial role. These unsung heroes handle messages from queues or brokers, ensuring tasks are executed seamlessly. But what happens when things go awry? Workers must be resilient, fault-tolerant, and reliable. This post dives into the essential properties every reliable worker should have, sprinkled with practical tips to keep your system humming. (Don’t worry, I have applied these rule of thumbs in several Xendit teams (and services), and we had almost zero issues, and make developers life happy!)
categories: software-engineering
tags: 
    - software-architecture
    - backend 
mermaid: true
image: "/docs/2025-01-01-understanding-software-architecture-characteristics-or-non-functional-requirements-in-a-nutshell/thumbnail.png"
minutes_read: 7
---

In the realm of distributed systems, especially when working with messaging patterns, workers play a crucial role. These unsung heroes handle messages from queues or brokers, ensuring tasks are executed seamlessly. But what happens when things go awry? Workers must be resilient, fault-tolerant, and reliable. This post dives into the essential properties every reliable worker should have, sprinkled with practical tips to keep your system humming. (Don’t worry, I have applied these rule of thumbs in several Xendit teams (and services), and we had almost zero issues, and make developers life happy!)

---

# Critical Properties for Reliable Messaging Workers

## 1. Traceability and Observability

![Pikachu Observe](https://tenor.com/bl83h.gif)

Imagine debugging a worker issue without any logs. Sounds like a nightmare, right? Observability is your system's flashlight in the dark. It allows you to monitor and debug distributed architectures with ease.

### Rule of Thumb:

Workers need end-to-end traceability to ensure smooth operations. Logs and distributed tracing are essential for tracking execution and identifying issues across services.

### Practical Example:

Consider a distributed payment system where transactions fail sporadically. Using tools like OpenTelemetry and setting up structured logging can help trace the issue from the API gateway to the database, pinpointing the exact failure point.

---

## 2. Recoverability

Failures are inevitable, but recovering gracefully sets reliable systems apart. Whether it’s a network hiccup or a broker outage, your worker shouldn’t just give up.

### Rule of Thumb:

1. Workers must automatically reconnect to the message broker after losing connection to prevent idling.
2. Replaying messages should recover processes without requiring manual interventions (e.g., manually updating transaction statuses).

### Practical Example:

Imagine a queue runner handling user notifications. If the broker disconnects mid-process, a robust recovery mechanism ensures pending notifications are retried without manual intervention, keeping users informed and the system intact.

---

## 3. Failed Message Durability

Not all messages are processed perfectly on the first try. That’s okay—as long as you have a plan for those pesky failures.

### Rule of Thumb:

- Failed messages must be persisted.
- Failed messages should be easily retrievable for retries.

### Practical Example:

A shipping service processes orders from a queue. If an order fails due to an external API timeout, persisting the failed message in a dead-letter queue allows the system to retry it later without losing the order.

---

## 4. Modularity

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

## 5. Idempotency

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

## 6. Resiliency

![Resilient Boxer](https://tenor.com/wbeC.gif)

A resilient worker is like a boxer who keeps getting up after every punch! Automatic retries and fallback mechanisms are critical to support resiliency properties.

### Rule of Thumb:

Workers should:

- Implement exponential backoff retry mechanisms.
- Use circuit breakers to prevent overwhelming downstream services during failures.

### Practical Example:

Imagine a data ingestion pipeline where a worker fetches data from an unstable third-party API. Using exponential backoff retries ensures the worker doesn’t overload the API, while circuit breakers prevent cascading failures to dependent services.

---

# Summary

| **Property** | **Description** | **Key Techniques** |
| --- | --- | --- |
| Traceability | Monitor and debug system behavior across services. | Structured logging, distributed tracing (e.g., OpenTelemetry). |
| Recoverability | Handle failures gracefully and recover automatically. | Automatic reconnections, message replay. |
| Failed Message Durability | Ensure failed messages are not lost and can be retried. | Dead-letter queues, persistent storage for failed messages. |
| Modularity | Simplify and maintain single responsibility for each worker. | Single state-changing operation, modular architecture. |
| Idempotency | Safely repeat tasks without inconsistent results. | ID-based tracking, state-based checks, database locks, distributed locks. |
| Resiliency | Continue functioning during partial failures. | Exponential backoff, circuit breakers. |

# Conclusion

By building workers with traceability, recoverability, durability, modularity, idempotency, and resiliency, you create a system that’s robust, maintainable, and scalable. These properties aren’t just nice-to-haves—they’re essential for surviving in the wild world of distributed systems. Happy coding!
