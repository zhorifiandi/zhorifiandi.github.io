---
title: Optimize Latency using Parallelization in Go
excerpt: Struggling with slow response times in your app? Often, the delay is due to slow dependencies, like third-party APIs. If you can't speed up these external services, try optimizing your own app's performance by leveraging parallelization. Running independent tasks concurrently can significantly reduce overall processing time and improve efficiency, even if some tasks remain slow.
categories: software-engineering
tags: 
    - backend 
    - go
mermaid: true
image: "/docs/2022-11-25-optimize-latency-using-parallelization-in-go/thumbnail.png"
minutes_read: 5
---

Ever wondered why your app server or worker takes longer than expected to complete tasks? Often, the culprit is slow dependencies—external services or operations your app depends on. If you control these dependencies, you can optimize them to reduce delays. But what if you don’t have control over them? For instance, you might rely on third-party APIs or services with fixed response times. 

In these cases, you can’t speed up the dependencies themselves, but you can improve your app’s performance by optimizing how you handle these operations. One effective approach is parallelization. By running independent tasks concurrently, you can reduce overall processing time and make your app more efficient, even if some tasks are slow.

* toc
{:toc}


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

```go
func CalculateTotalPrice_Sequential() float64 {
	productA := FetchProductAData()
	productB := FetchProductBData()
	seller := FetchSellerData()
	shippingFee := FetchShippingFee(seller.Address)
	promo := FetchPromoInformation()

	totalPrice := productA.Price + productB.Price + shippingFee.Amount - promo.Discount
	log.Default().Printf("Total Price: %v\n", totalPrice)

	return totalPrice
}
```

## Parallelizing the Process
Leverage [Goroutines](https://go.dev/tour/concurrency) and [Wait Group](https://pkg.go.dev/sync#WaitGroup) to parallelize tasks:

### Parallel Group 1: `fetchProductAndSellerInfo`
Here are the `fetchProductAndSellerInfo` which defined in the flow diagram
```go
func fetchProductAndSellerInfo(order *Order) {
	var productA Product
	var productB Product
	var seller Seller
	var wg sync.WaitGroup

	wg.Add(3)
	go func() {
		defer wg.Done()
		productA = FetchProductAData()
	}()

	go func() {
		defer wg.Done()
		productB = FetchProductBData()
	}()

	go func() {
		defer wg.Done()
		seller = FetchSellerData()
	}()

	wg.Wait()

	*order = Order{
		Products: []Product{productA, productB},
		Seller:   &seller,
	}
}
```

### Sequential Group 1: `fetchShippingFee`
Here are the `sequential group 1` which defined in the flow diagram
```go
// sequential group 1
func fetchShippingFee(order *Order) {
	fetchProductAndSellerInfo(order)
	shipping := FetchShippingFee(order.Seller.Address)
	order.Shipping = &shipping
}
```

### Parallel Group 2: `fetchCalculationComponents`
Here are the `parallel group 2`
```go
func fetchCalculationComponents(order *Order) {
	var promo Promo
	var wg sync.WaitGroup

	wg.Add(2)
	go func() {
		defer wg.Done()
		promo = FetchPromoInformation()
		order.Promo = &promo
	}()

	go func() {
		defer wg.Done()
		fetchShippingFee(order)
	}()

	wg.Wait()
}
```

### Finally: CalculateTotalPrice_Parallelized
Here is the Final Function
```go
func CalculateTotalPrice_Parallelized() float64 {
	var order Order
	fetchCalculationComponents(&order)

	totalPrice := order.Products[0].Price + order.Products[1].Price + order.Shipping.Amount - order.Promo.Discount
	log.Default().Printf("Total Price: %v\n", totalPrice)

	return totalPrice
}
```

## Benchmark
### Sequential Function 
Elapsed time 5.279 seconds 🐢🐢🐢
```sh
go test -timeout 300s -run ^TestCalculateTotalPrice_Sequential$ github.com/zhorifiandi/golearn/parallelization -v

=== RUN   TestCalculateTotalPrice_Sequential
2024/09/17 15:56:49 Product A data fetched
2024/09/17 15:56:50 Product B data fetched
2024/09/17 15:56:51 Seller data fetched
2024/09/17 15:56:52 Shipping fee fetched
2024/09/17 15:56:53 Promo information fetched
2024/09/17 15:56:53 Total Price: 155
    /Users/arizho/CODEPERSONAL/golearn/parallelization/run-all_test.go:16: Elapsed time: 5.007204791s
--- PASS: TestCalculateTotalPrice_Sequential (5.01s)
PASS
ok  	github.com/zhorifiandi/golearn/parallelization	5.279s
```

### Parallelized Function 
Elapsed time 2 seconds. Much Fasteer!!! 🚀🚀🚀🚀🚀
```sh
go test -timeout 300s -run ^TestCalculateTotalPrice_Parallelized$ github.com/zhorifiandi/golearn/parallelization -v

=== RUN   TestCalculateTotalPrice_Parallelized
2024/09/17 15:56:17 Promo information fetched
2024/09/17 15:56:17 Product A data fetched
2024/09/17 15:56:17 Product B data fetched
2024/09/17 15:56:17 Seller data fetched
2024/09/17 15:56:18 Shipping fee fetched
2024/09/17 15:56:18 Total Price: 155
    /Users/arizho/CODEPERSONAL/golearn/parallelization/run-all_test.go:24: Elapsed time: 2.0042865s
--- PASS: TestCalculateTotalPrice_Parallelized (2.00s)
PASS
ok  	github.com/zhorifiandi/golearn/parallelization	(cached)
```

# Conclusion
In this post, we demonstrated how parallelization can drastically reduce processing time by improving task efficiency. By reorganizing a sequential workflow for calculating prices in a marketplace into parallel and sequential groups, we cut the total processing time from ***5 seconds*** to ***2 seconds***.

Using Go’s goroutines and sync.WaitGroup, we effectively managed concurrent tasks, showcasing how even with fixed external dependencies, you can optimize performance within your application.

For the full implementation details, visit the [Github Repository](https://github.com/zhorifiandi/golearn/tree/main/parallelization).

Thank you for reading!