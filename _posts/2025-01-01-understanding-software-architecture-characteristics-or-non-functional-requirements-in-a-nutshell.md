---
title: Understanding Software Architecture Characteristics (or Non Functional Requirements) in a Nutshell
excerpt: When building software systems, understanding your functional requirements—what features your system should provide—is crucial. However, that alone will only take you so far. To truly ensure the success and longevity of your system, you need to go beyond the functional aspects and dive into Non-Functional Requirements (NFRs).
categories: software-engineering
tags: 
    - software-architecture
    - backend 
mermaid: true
image: "/docs/2025-01-01-understanding-software-architecture-characteristics-or-non-functional-requirements-in-a-nutshell/thumbnail.png"
minutes_read: 4
---

![Understanding Software Architecture Characteristics (or Non Functional Requirements) in a Nutshell](/docs/2025-01-01-understanding-software-architecture-characteristics-or-non-functional-requirements-in-a-nutshell/thumbnail.png)


> **Architecture Characteristics** are anything that describes **concerns critical to the success of the architecture**, and therefore the system as a whole, **without discounting its importance**. Another terms for these: ***Non functional Requirements***; ***Quality Attributes.***. From Book: Fundamentals of Software Architecture by Mark Richards and Neal Ford ([google books](https://books.google.co.id/books/about/Fundamentals_of_Software_Architecture.html?id=_pNdwgEACAAJ&redir_esc=y))

When building software systems, understanding your functional requirements—what features your system should provide—is crucial. However, that alone will only take you so far. To truly ensure the success and longevity of your system, you need to go beyond the functional aspects and dive into Non-Functional Requirements (NFRs).

NFRs, or also known as (Software) Architecture Characteristics, focus on how well your system performs, how resilient it is to failures, how easily it can scale, and how secure it remains. These are the qualities that determine whether your software will be reliable under load, adaptable to change, and secure against threats.

In this post, we'll briefly describe the key NFRs or architecture characteristics that every software system needs to consider. Understanding and addressing these factors is essential not only for meeting current needs but for ensuring that your system thrives as it grows.

# Architecture Characteristics / NFR Categorization

We can categorize NFRs or Architecture Characteristics as 3 big categories:

1. **Operational Architecture Characteristics** - covering operational capabilities of how the distributed systems work
2. **Structural Architecture Characteristics** - covering code structure quality concerns
3. **Cross-Cutting Architecture Characteristics** - covering characteristics that fall outside recognizable categories, yet form important design constraints and considerations.

## Operational Architecture Characteristics

> **Operational Architecture Characteristics** - covering operational capabilities of how the distributed systems work

| **NFR / Architecture Characteristic** | **Definition** |
| --- | --- |
| Reliability | The probability of failure-free operation for a specified period in a specified environment. |
| Availability | How long the system needs to be available. |
| Resiliency | The ability of the system to heal from unexpected events automatically. |
| Business Continuity | How quickly the system can recover in the event of a disaster. |
| Performance | How well the system performs under specified metrics. |
| Scalability | The system’s ability to maintain performance with increasing load. |
| Toil | Tasks that require manual effort. |

### **1. Reliability**

Reliability refers to the probability that a system will operate without failure over a specific period and in a specified environment. These metrics help you monitor the frequency and severity of incidents, ensuring that reliability stays within acceptable limits and identifying areas that need improvement.

**Metrics can be used**

- **MTBI (Mean Time Between Incidents)**: Measures the average time between system failures. A higher MTBI indicates a more reliable system.
- **Number of Incidents**: Tracks the number of failures or outages. The goal is to minimize this number to ensure smooth operations.

### **2. Availability**

Availability refers to the amount of time a system is operational and accessible to users. A higher uptime percentage reflects the system's availability, with goals to minimize downtime and ensure that the system is always accessible when users need it.

**Metrics can be used**

- **Web Server Up Time**: Measures the amount of time the web server is operational without downtime.

### **3. Resiliency**

Resiliency is the system's ability to recover from unexpected events automatically, without manual intervention. A more resilient system requires fewer manual recovery processes, indicating better automation and fault tolerance within the system.

**Metrics can be used**

- **Number of Manual Recovery Processes**: Tracks how often manual intervention is required to restore the system after failure.

### **4. Business Continuity**

Business continuity refers to the system’s ability to recover and continue operations in the event of a disaster or critical failure. A disaster can mean a lot of things: Database down, Servers down, Cloud Provider Down, or even Third Party Down. These metrics help ensure that systems can quickly recover from major incidents and that any disruptions to service are minimal.

**Metrics can be used**

- **MTTR (Mean Time to Recovery)**: Measures how long it takes to recover from a failure and bring the system back online.
- **MTTREC (Mean Time to Reconcile)**: Tracks the time taken to restore data consistency after a failure.

### **5. Performance**

Performance measures how well the system performs under load, typically in terms of responsiveness and efficiency. These metrics provide a comprehensive view of system performance, helping to identify bottlenecks and optimize response times for a better user experience.

**Metrics can be used**

- **Golden Metrics**: Includes key performance indicators like throughput, latency, error rate, and saturation that define overall system performance.
- **End-to-End Transaction Time**: Tracks the time taken for a transaction to move from start to finish within the system.

### **6. Scalability**

Scalability refers to the system’s ability to maintain or improve performance when traffic or load increases. These metrics help assess whether the system can handle growth and adapt to increased user demands without performance degradation.

**Metrics can be used**

- **Stress Test Results**: Results from testing the system’s performance under extreme load conditions.

### **7. Toil**

Toil refers to manual, repetitive tasks that consume time and resources. Minimizing toil is key to improving system efficiency and developer satisfaction. Reducing toil means automating repetitive tasks and addressing issues proactively, leading to smoother operations and better customer experiences.

**Metrics can be used**

- **Number of Customer Issues**: Measures the frequency of customer-reported issues that require manual intervention.

---

## Structural Architecture Characteristics

> **Structural Architecture Characteristics** - covering code structure quality concerns

| **NFR / Architecture Characteristic** | **Definition** |
| --- | --- |
| Maintainability | The ease of applying changes or enhancements to the system. |
| Quality | The quality of the system’s design and conformance to that design. |
| Testability | The degree to which software supports testing. |

### **1. Maintainability**

Maintainability refers to how easily a system can be modified, enhanced, or fixed after deployment. These metrics help ensure that the system can be easily updated, and new features can be added without excessive delays or issues.

**Metrics can be used**

- **Mean Time to Ship New Features**: Tracks the average time taken to develop and release new features.
- **PR Review Time**: Measures the time taken to review and merge pull requests.
- **Deployment Time**: Tracks the time taken to deploy changes to production.
- **Maintainability Score from Code Scanning tools**: A tool that evaluates the maintainability of code based on factors like complexity and code duplication. Sample software: [SonarQube](https://github.com/SonarSource/sonarqube).

### **2. Quality**

Quality refers to how well the software is designed and how closely it adheres to that design. These metrics help assess the overall quality of the system, ensuring that both the design and implementation meet the required standards and minimize defects.

**Metrics can be used**

- **Number of Bugs**: Tracks the number of defects found in the system.
- **Number of Customer Issues**: Measures customer-reported problems that may indicate design or implementation flaws.

### **3. Testability**

Testability measures how easily the system can be tested for correctness, performance, and reliability. These metrics ensure that the system can be effectively tested, with high test coverage and reliable test results, leading to fewer bugs and issues post-deployment.

**Metrics can be used**

- **Test Coverage**: Tracks the percentage of code covered by automated tests.
- **Regression Test Pass Rates**: Measures the success rate of regression tests that ensure new changes don’t break existing functionality.

---

## **Cross-Cutting** Architecture Characteristics

> **Cross-Cutting Architecture Characteristics** - covering characteristics that fall outside recognizable categories, yet form important design constraints and considerations.


| **NFR / Architecture Characteristic** | **Definition** |
| --- | --- |
| Security | Security measures for authentication, authorization, and audit compliance. |
| Compliance | Adherence to regulatory and legal constraints (e.g., GDPR, HIPAA). |

### **1. Security**

Security measures for authentication, authorization, and audit compliance.

**Metrics can be used**

- Penetration testing Findings
- Compliance with standards (e.g., ISO via 3rd Party Auditor)

### **2. Compliance**

Ensuring the system meets legislative and regulatory requirements (e.g., GDPR).

**Metrics can be used**

- Compliance review outcomes with internal Compliance Team

---

# Maintaining Architecture Characteristics / NFR in your Systems

Remember, Addressing architecture characteristics isn’t a one-time task! It’s an ongoing process that requires consistent maintenance. Below are some strategies and processes for maintaining these Non-Functional Requirements (NFRs) in your systems:

### **1. Regular Technical Reviews**

Conduct monthly or quarterly reviews to assess the performance, availability, and reliability metrics of your system. This helps identify trends and detect areas where improvements are necessary before issues escalate. You can use tools like automated monitoring dashboards and reports to evaluate MTBI, MTTR, and other metrics regularly.

#### Conduct Chaos Engineering for Resilience Testing

Regularly test how your system behaves under failure scenarios using techniques like chaos engineering. This ensures the system can handle unexpected events and recover gracefully. Simulate failures, such as server crashes or database outages, and observe system responses to evaluate resiliency. You can find insightful list of resources on chaos engineering in here: [awesome-chaos-engineering](https://github.com/dastergon/awesome-chaos-engineering)

#### Security and Compliance Audits

Perform regular penetration tests, license audits, and compliance reviews and address gaps proactively. Staying ahead of security vulnerabilities and regulatory changes minimizes risks. 

### **2. Automate Wherever Possible**

Automate deployments, testing, monitoring, and recovery processes to reduce toil and ensure consistency. Automation improves reliability, reduces human error, and enhances system resiliency. You can implement CI/CD pipelines, auto-scaling features, and incident recovery scripts or crons to manage these processes efficiently.

### **3. Emphasize Observability**

Invest in comprehensive logging, tracing, and monitoring tools to enhance system observability. Observability allows developers to detect issues quickly and understand their root causes. You can leverage tools like distributed tracing and centralized logging platforms to maintain a clear view of your system's health.

### **4. Define and Follow Architecture Maintenance Guidelines**

Create clear guidelines for maintaining each NFR, such as specific metrics and their thresholds. These guidelines ensure consistency and a shared understanding of system goals across teams. For example, define acceptable MTTR or uptime thresholds and set up alerts for when metrics deviate.

### **5. Foster a Culture of Ownership**

Encourage teams to own and improve architecture characteristics actively. Teams with ownership mindsets are more likely to identify and fix issues early. Define roles and responsibilities clearly, and provide tools and training to enable proactive monitoring and maintenance.

---

# Conclusions

Architecture Characteristics or Non-Functional Requirements (NFRs) are the backbone of a robust, scalable, and resilient system. By identifying and prioritizing architecture characteristics, you create a foundation for a system that not only meets functional requirements at given initial time, but also evolves over time.

Maintaining these architecture characteristics is a continuous effort that involves regular reviews, automation, testing, and fostering a culture of responsibility. 

Remember, investing in architecture characteristics early on saves time, effort, and cost in the long run. The success of your system lies not only in its features but in how well it performs, adapts, and overcomes challenges.