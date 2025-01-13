---
title: Optimize Latency using Parallelization in Node.js
excerpt: Struggling with slow response times in your app? Often, the delay is due to slow dependencies, like third-party APIs. If you can't speed up these external services, try optimizing your own app's performance by leveraging parallelization. Running independent tasks concurrently can significantly reduce overall processing time and improve efficiency, even if some tasks remain slow.
categories: software-engineering
tags: 
    - backend 
    - nodejs
mermaid: true
image: "/docs/2024-12-18-optimize-latency-using-parallelization-in-nodejs/thumbnail.png"
minutes_read: 5
---

![Node.js Parallelization Illustration](/docs/2024-12-18-optimize-latency-using-parallelization-in-nodejs/illustration.webp)

Ever wondered why your app server or worker takes longer than expected to complete tasks? Often, the culprit is slow dependencies—external services or operations your app depends on. If you control these dependencies, you can optimize them to reduce delays. But what if you don’t have control over them? For instance, you might rely on third-party APIs or services with fixed response times. 

In these cases, you can’t speed up the dependencies themselves, but you can improve your app’s performance by optimizing how you handle these operations. One effective approach is parallelization. By running independent tasks concurrently, you can reduce overall processing time and make your app more efficient, even if some tasks are slow.

> If you prefer the write up in Go, you can refer to [this blog post](https://zhorifiandi.github.io/software-engineering/2022/11/25/optimize-latency-using-parallelization-in-go.html) instead

---

* toc
{:toc}

---

# Case: Calculate Total Price in Marketplace Purchase

To illustrate how parallelization can improve performance, let’s examine a typical workflow for calculating the total price in an online marketplace. The process involves several sequential steps, each dependent on the results of the previous one.

## Workflow Descriptions
1. `FetchProductAData`: Retrieve details for Product A, including its price.
2. `FetchProductBData`: Retrieve details for Product B, including its price.
3. `FetchSellerData`: Obtain information about the seller, which is needed for calculating shipping fees.
4. `FetchShippingFee`: Calculate the shipping fee based on the data from Products A and B, and the seller.
5. `FetchPromoInformation`: Retrieve any applicable discount or promo code details.
6. `CalculateTotalPrice`: Combine all the gathered data (product prices, shipping fee, and promo) to compute the final price.


### Naive Sequential Process
In a naive approach, each step must wait for the previous step to complete before starting. This leads to inefficient processing times as tasks are done one after another.

<pre class="mermaid">
graph TD
    start-->Process1
    Process1[P1: Fetch Product A Data] -->|1 second| Process2[P2: Fetch Product B Data]
    Process2 -->|1 second| Process3[P3: Fetch Seller Data]
    Process3 -->|1 second| Process4[P4: Fetch Shipping Fee]
    Process4 -->|1 second| Process5[P5: Fetch Promo Information]
    Process5 -->|1 second| Process6[P6: Calculate Total Price]
    Process6 -->|1 second| e[end]
</pre>

Notes:
- To Fetch Product Data, the app will need `product_id`
- To Fetch Seller Data, the app will need `product_id`
- To Fetch Shipping Fee, the app will need `product data` and `seller data` fetched from `Process 1`, `Process 2`, and `Process 3`.
- To Fetch Promo Information, the app will need `promo_code`
- Formula: Total Price = Product A Price + Product B Price + Shipping Fee + Tax Fee - Promo Code 

*Overall app latency will take 5 seconds! 🥲*

## What Can We Improve From Our App Scope? 🤔

### Key concerns
1. Does the order of all task execution matters? 
2. Can we swap the order of execution between any process and the other Process?
3. If not, which process the order of execution really matters

### Analysis
The order of executions that really matters:
1. `FetchShippingFee` must be executed after `FetchProductAData`, `FetchProductBData`, and `FetchSellerData`.
2. `CalculateTotalPrice` must be executed after other processes.

The order of executions of other processes can be swapped.

## 💡 Proposal: Group the Processes and Make it Parallel! 
> Steps: 
> - Group the processes into the same group if the ordering don't really matters -> Let's call it Parallel group
> - Group the processes into the same group if the ordering really matters. -> Let's call it Sequential group

From the above analysis, we can organize the processes into these groups:

### Parallel Group 1: Fetch Product and Seller Information
- **Process 1:** Fetch Product A Data
- **Process 2:** Fetch Product B Data
- **Process 3:** Fetch Seller Data

### Sequential Group 1: Fetch Shipping Fee
Sequential Group 1 consists of:
- **Parallel Group 1** (Fetch Product and Seller Information)
- **Process 4:** Fetch Shipping Fee

### Parallel Group 2: Fetch Promo Information
Parallel Group 2 consists of:
- **Sequential Group 1** (Fetch Shipping Fee)
- **Process 5:** Fetch Promo Information

### Sequential Group 2: Calculate Total Price
Sequential Group 2 consists of:
- **Parallel Group 2** (Fetch Promo Information)
- **Process 6:** Calculate Total Price

### Parallelized Workflow Diagram
The parallelized approach improves efficiency by executing independent tasks concurrently.
<pre class="mermaid">
graph TD

    start-->p0[parallelize]
    p0-->p1[parallelize]
    subgraph Parallel Group 2
        subgraph Sequential Group 1
            subgraph Parallel Group 1
                p1-->Process1[P1: Fetch Product A Data]
                p1-->Process2[P2: Fetch Product B Data]
                p1-->Process3[P3: Fetch Seller Data]
                Process1-->|1 second|e1[End of Parallelization]
                Process2-->|1 second|e1
                Process3-->|1 second|e1
            end
            e1 -->|1 second| Process4[P4: Fetch Shipping Fee]
        end
        p0 -->|1 second| Process5[P5: Fetch Promo Information]
    end
    Process5 -->|1 second| Process6[P6: Calculate Total Price]
    Process4-->|1 second|Process6
    Process6 -->|1 second| e[end]
    
</pre>

# Let's Get into The Code!

## Initial Code (Naive Sequential Approach)

Here’s how the naive sequential version of the `CalculateTotalPrice` function looks:

```typescript
export async function calculateTotalPriceSequential(): Promise<number> {
  const productA = await fetchProductAData();
  const productB = await fetchProductBData();
  const seller = await fetchSellerData();
  const shippingFee = await fetchShippingFee(seller.address);
  const promo = await fetchPromoInformation();

  const totalPrice =
    productA.price + productB.price + shippingFee.amount - promo.discount;
  console.log(`Total Price: ${totalPrice}`);

  return totalPrice;
}
```

## Parallelizing the Process
Leverage the basic [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all). If you haven't understand about `Promise`, please read this first: [Using Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

### Parallel Group 1: `fetchProductAndSellerInfo`
Here are the `fetchProductAndSellerInfo` which defined in the flow diagram
```typescript
export async function fetchProductAndSellerInfo(order: Order): Promise<void> {
  const [productA, productB, seller] = await Promise.all([
    fetchProductAData(),
    fetchProductBData(),
    fetchSellerData(),
  ]);

  order.products = [productA, productB];
  order.seller = seller;
}
```

### Sequential Group 1: `fetchShippingFee`
Here are the `sequential group 1` which defined in the flow diagram
```typescript
// sequential group 1
export async function fetchShippingFeeForOrder(order: Order): Promise<void> {
  await fetchProductAndSellerInfo(order);
  order.shipping = await fetchShippingFee(order.seller!.address);
}
```

### Parallel Group 2: `fetchCalculationComponents`
Here are the `parallel group 2`
```typescript
export async function fetchCalculationComponents(order: Order): Promise<void> {
  await Promise.all([
    fetchPromoInformation().then((promo) => (order.promo = promo)),
    fetchShippingFeeForOrder(order),
  ]);
}
```

### Finally: calculateTotalPriceParallelized
Here is the Final Function
```typescript
export async function calculateTotalPriceParallelized(): Promise<number> {
  const order: Order = { products: [] };
  await fetchCalculationComponents(order);

  const totalPrice =
    order.products[0].price +
    order.products[1].price +
    order.shipping!.amount -
    order.promo!.discount;
  console.log(`Total Price: ${totalPrice}`);

  return totalPrice;
}
```

## Benchmark
### Sequential Function 
Elapsed time 5.016 seconds 🐢🐢🐢
```sh
Product A data fetched
Product B data fetched
Seller data fetched
Shipping fee fetched
Promo information fetched
Total Price: 155
Sequential: 5.016s
```

### Parallelized Function 
Elapsed time 2.01 seconds. Much Fasteer!!! 🚀🚀🚀🚀🚀
```sh
Promo information fetched
Product A data fetched
Product B data fetched
Seller data fetched
Shipping fee fetched
Total Price: 155
Parallelized: 2.010s
```

# Conclusion
In this post, we demonstrated how parallelization can drastically reduce processing time by improving task efficiency. By reorganizing a sequential workflow for calculating prices in a marketplace into parallel and sequential groups, we cut the total processing time from ***5 seconds*** to ***2 seconds***.

Using `Promise.all`, we effectively managed concurrent tasks, showcasing how even with fixed external dependencies, you can optimize performance within your application.

For the full implementation details, visit the [Github Repository](https://github.com/zhorifiandi/golearn/tree/main/ts/parallelization).

Thank you for reading!