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
    Process1[Fetch Product A Data] -->|1 second| Process2[Fetch Product B Data]
    Process2 -->|1 second| Process3[Fetch Seller Data]
    Process3 -->|1 second| Process4[Fetch Shipping Fee]
    Process4 -->|1 second| Process5[Fetch Promo Information]
    Process5 -->|1 second| Process6[Calculate Total Price]
    Process6 -->|1 second| e[end]
</pre>

Notes:
- To Fetch Product Data, the app will need `product_id`
- To Fetch Seller Data, the app will need `product_id`
- To Fetch Shipping Fee, the app will need `product data` and `seller data` fetched from `Process 1`, `Process 2`, and `Process 3`.
- To Fetch Promo Information, the app will need `promo_code`
- Formula: Total Price = Product A Price + Product B Price + Shipping Fee + Tax Fee - Promo Code 



> Overall app latency will take 5 seconds! :smiling_face_with_tear:

How can we do to improve the overall latency from our App scope? :thinking:

### Key concerns
1. Does the order of all task execution matters? 
2. Can we swap the order of execution between any process and the other Process?
3. If not, which process the order of execution really matters

### Analysis
The order of executions that really matters:
1. `Process 4` must be executed after `Process 1`, `Process 2`, and `Process 3`
2. `Process 6` must be executed after other Processes.

The order of executions of other processes can be swapped.

### Proposal: Make it Parallel!
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
                p1-->Process1[Fetch Product A Data]
                p1-->Process2[Fetch Product B Data]
                p1-->Process3[Fetch Seller Data]
                Process1-->|1 second|e1[End of Parallelization]
                Process2-->|1 second|e1
                Process3-->|1 second|e1
            end
            e1 -->|1 second| Process4[Fetch Shipping Fee]
        end
        p0 -->|1 second| Process5[Fetch Promo Information]
    end
    Process5 -->|1 second| Process6[Calculate Total Price]
    Process4-->|1 second|Process6
    Process6 -->|1 second| e[end]
    
</pre>

## Let's Get into The Code!

Instead of running it sequentially

```go
func RunAllSequential(numOfProcess int, processingTime uint) time.Duration {
	start := time.Now()

	for i := 1; i <= numOfProcess; i++ {
		ExecuteMockProcess(processingTime)
	}

	return time.Since(start)
}
```

Try to parallelize it! Leverage
- Goroutines
- Wait Group

```go
func RunAllParallel(numOfProcess int, processingTime uint) time.Duration {
	start := time.Now()

	var wg sync.WaitGroup

	for i := 1; i <= numOfProcess; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ExecuteMockProcess(processingTime)
		}()
	}

	wg.Wait()
	return time.Since(start)
}

```

Full source code can be seen in this github: [https://github.com/zhorifiandi/golearn/tree/main/parallelization](https://github.com/zhorifiandi/golearn/tree/main/parallelization)