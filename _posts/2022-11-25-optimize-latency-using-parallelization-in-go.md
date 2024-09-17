---
title: Optimize Latency using Parallelization in Go
excerpt: Ever wondered why your app server/worker takes long time? In some cases, it's caused by "slow" dependencies. If the dependencies are in your control, you can try to optimize the latency in dependencies sides. However, What if you don't have the control and it's beyond your scope to optimize the dependencies? What's the most feasible way to optimize your app latency from only your app scope?
categories: software-engineering
tags: 
    - backend 
    - go
mermaid: true
image: "/docs/2022-11-25-optimize-latency-using-parallelization-in-go/thumbnail.png"
minutes_read: 5
---

* toc
{:toc}

## Background

Ever wondered why your app server/worker takes long time? In some cases, it's caused by "slow" dependencies. If the dependencies are in your control, you can try to optimize the latency in dependencies sides. 

However, What if you don't have the control and it's beyond your scope to optimize the dependencies? What's the most feasible way to optimize your app latency from only your app scope?

## Case: Calculate Total Price in Marketplace Purchase

Imagine your app is a backend component in Marketplace to calculate total price of a purchase from a seller. 

### Assumptions
- Buyer buy Product A and Product B from same seller
- Shipping Fee can be combined for two products
- Buyer needs to pay some taxes
- Buyer have a promo code, so that they can have a discount! To simplify, let say the discount is flat!



This is how your app flow will generally work:
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



> Overall app latency will take 5 seconds! 🥲

## What can we improve from our App scope? 🤔

### Key concerns
1. Does the order of all task execution matters? 
2. Can we swap the order of execution between any process and the other Process?
3. If not, which process the order of execution really matters

### Analysis
The order of executions that really matters:
1. `Process 4` must be executed after `Process 1`, `Process 2`, and `Process 3`
2. `Process 6` must be executed after other Processes.

The order of executions of other processes can be swapped.

## 💡 Proposal: Make it Parallel! 
> Steps: 
> - Group the processes into the same group if the ordering don't really matters -> Let's call it Parallel group
> - Group the processes into the same group if the ordering really matters. -> Let's call it Sequential group

From above rule, we can have these list of groups
1. Parallel Group 1, consists of: `Process 1`, `Process 2`, `Process 3`
2. Sequential Group 1, consists of: `Parallel Group 1` and `Process 4`
3. Parallel Group 2, consists of: `Sequential Group 1` and `Process 5`
4. Sequential Group 2, consists of: `Parallel Group 2` and `Process 6`


Hence, we can have the app to work like this
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

## Let's Get into The Code!

### Initial Code (using Sequential Approach)

Let say you have these base functions for fetch product, seller, etc.
```go
type Product struct {
	Name  string
	Price float64
}

type Seller struct {
	Name    string
	Address string
}

type ShippingFee struct {
	Amount float64
}

type Promo struct {
	Discount float64
}

func FetchProductAData() Product {
	ExecuteMockProcess(ProcessingTime)
	log.Default().Println("Product A data fetched")
	return Product{
		Name:  "Product A",
		Price: 50,
	}
}

func FetchProductBData() Product {
	ExecuteMockProcess(ProcessingTime)
	log.Default().Println("Product B data fetched")
	return Product{
		Name:  "Product B",
		Price: 100,
	}
}

func FetchSellerData() Seller {
	ExecuteMockProcess(ProcessingTime)
	log.Default().Println("Seller data fetched")
	return Seller{
		Name:    "Seller A",
		Address: "Address A",
	}
}

func FetchShippingFee(sellerAddress string) ShippingFee {
	ExecuteMockProcess(ProcessingTime)
	log.Default().Println("Shipping fee fetched")
	return ShippingFee{
		Amount: 10,
	}
}

func FetchPromoInformation() Promo {
	ExecuteMockProcess(ProcessingTime)
	log.Default().Println("Promo information fetched")
	return Promo{
		Discount: 5,
	}
}

```

Then you have the *sequential* version of the *CalculateTotalPrice* function, which is simple yet slow.

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

### Group and Parallelize each Process

Try to parallelize it! Leverage
- Goroutines
- Wait Group

Here are the `parallel group 1` which defined in the flow diagram
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

Here are the `sequential group 1` which defined in the flow diagram
```go
// sequential group 1
func fetchShippingFee(order *Order) {
	fetchProductAndSellerInfo(order)
	shipping := FetchShippingFee(order.Seller.Address)
	order.Shipping = &shipping
}
```

Here are the `parallel group 2`
```go
func fetchCalculationComponents(order *Order) {
	var promo Promo
	var wg sync.WaitGroup

	wg.Add(2)
	go func() {
		defer wg.Done()
		promo = FetchPromoInformation()
	}()

	go func() {
		defer wg.Done()
		fetchShippingFee(order)
	}()

	wg.Wait()

	order.Promo = &promo
}
```

### Finally the CalculateTotalPrice_Parallelized
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

Full source code can be seen in this github: [https://github.com/zhorifiandi/golearn/tree/main/parallelization](https://github.com/zhorifiandi/golearn/tree/main/parallelization)


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

That's it, thanks for reading!