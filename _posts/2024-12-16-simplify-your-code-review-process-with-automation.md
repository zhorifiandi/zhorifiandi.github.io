---
title: Simplify Your Code Review Process with Automation Tools!
excerpt: As engineering teams grow, code reviews become challenging yet still crucial for quality control. We've all been there – nitpicking over minor issues while important stuff gets lost. These reviews often become bottlenecks, slowing us down. But by leveraging smart tools and focusing on what really matters, we can speed up the process and make it more effective. Say goodbye to endless debates about tabs vs. spaces!
categories: software-engineering
tags: 
    - sdlc
mermaid: true
image: "/docs/2024-12-16-simplify-your-code-review-process-with-automation/thumbnail.png"
minutes_read: 5
---

![Code Review Illustration](/docs/2024-12-16-simplify-your-code-review-process-with-automation/illustration.webp)

As engineering teams grow, code reviews become *challenging*. We've all been there – nitpicking over minor issues while important stuff gets lost. 

- Le Senior Reviewer 🗣️: Hey, can you change this tab with 2 spaces instead?
- Author 😐: Okay...
- Le Senior Reviewer 🗣️: Hmmm, i think you should use snake_case instead of camelCase, for this function?
- Author 😐: Okay...
- Le Senior Reviewer 🗣️: Ok, LGTM!

*..... 2 hours later*

- Product Manager🗿: Hey, Is there any deployment? Why can't I access the homepage?
- Le Senior Reviewer 🗣️: Checking.... What the *%@$%#... The last PR use the incorrect env variable...

*Disclaimer: Not real story of mine..*

These kind of reviews often become bottlenecks, slowing us down, put heavy toils on developers, or in worst case, even cost us! (*Production Down*) It needs to stop! By leveraging existing tools and focusing on what really matters, we can speed up the code review and make it more effective. Say goodbye to endless debates about tabs vs. spaces!

---

* toc
{:toc}

---

## Common Code Review Challenges

Before diving into solutions, let’s look at some common challenges in "traditional” code review processes:

- **Manual Checks Are Tedious:** Reviewers often find themselves bogged down by minor style issues or syntax nits, making it harder to focus on the actual logic.
- **Review Quality Is Inconsistent:** Different reviewers may focus on different aspects, which can lead to inconsistent standards across the codebase.
- **Important Details Get Missed:** Manual reviews may not always catch edge cases, especially if the reviewer is unfamiliar with certain code sections.
- **Focus Gets Diverted:** Time spent on minor issues reduces the focus on essential aspects like performance, architecture, or potential scaling issues.

---

## Streamlining Code Review with Tool-Based Solutions

> *I don't want to reinvent the wheel—the only source of truth you should trust is the official documentation for each tool. I'll provide links and references on how to implement them. 🤞.*

### 1. **Linter and Static Code Scanning**

Linters ensure code follows a consistent style before it reaches the reviewer, while static code scanning analyzes problems and errors not caught by compilers. Most tools provide both functionalities out of the box.

This allows developers to focus on logic instead of nitpicking style issues. It’s best to not only use it locally during development but also integrate these tools into your CI pipeline to automatically run checks on pull requests (PRs). PRs with style violations are flagged, preventing “bad” code from unintentionally being merged into the trunk/master/main branch.

#### JavaScript/TypeScript - ESLint

For JavaScript teams, setting up Prettier as a pre-commit hook automatically formats code, eliminating style discrepancies and maintaining consistency across the codebase.

- [ESLint Documentation](https://eslint.org/docs/latest/use/getting-started)  
- [Run ESLint in GitHub Actions](https://github.com/marketplace/actions/run-eslint)

#### Go - Golangci-lint

For Go teams, [golangci-lint](https://golangci-lint.run/) is recommended by the [official Go Wiki](https://go.dev/wiki/CodeTools). It bundles tools like [**Staticcheck**](https://staticcheck.dev/docs/running-staticcheck/cli/) and [`go vet`](https://pkg.go.dev/cmd/vet), which are highly regarded by Go authors.  

- [Golangci-lint Documentation](https://golangci-lint.run/welcome/quick-start/)  
- [Run Golangci-lint in GitHub Actions](https://github.com/golangci/golangci-lint-action?tab=readme-ov-file#how-to-use)

---

### 2. **Integrate Automated Tests in Pull Requests (PRs)**

Automated tests validate functionality and performance. Running these tests on every PR catches bugs before merging. These tests can include unit tests, integration tests, or even performance/load tests.  

#### GitHub Actions Examples:

- [Go](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-go)  
- [Node.js](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs)

---

### 3. **Add Code Scanning for Security and Code Quality**

Security vulnerabilities and code quality issues can be hard to spot manually, especially in large codebases. Tools like [SonarQube](https://github.com/SonarSource/sonarqube) perform automated scans to identify issues.  This tool will have checking on this area:
- Reliability
- Security Vulnerabilities
- Code Smells


Check the list of available rules in here: https://rules.sonarsource.com/

---

### 4. **Implement Architecture Unit Tests**
Checking for architectural consistency can be hard, especially as systems grow. Architecture tests ensure that code changes adhere to the established design and principles, keeping the codebase organized and scalable.

Tool that pioneering this is [ArchUnit](https://www.archunit.org/), which covers Java and .NET/C#. (I haven’t tried them😅). However, I have tried other toos which inspired by ArchUnit:
- [ts-arch for TypeScript](https://github.com/ts-arch/ts-arch)  
- [arch-go for Golang](https://github.com/fdaines/arch-go)

You can write custom architecture validation tests and integrate them into your CI pipeline. This is especially useful for teams that want to maintain strict boundaries between modules. For instance, your team’s implementing clean architecture, and you want to avoid Controller layer directly calls DB Layer, you can set up this kind of rules. (Pray for me to write article on this one further)

---

## Effective Code Reviews: Focus on What Really Matters

Once automated tools handle the more tedious parts, reviewers can focus on areas that really matters:

### Feature Requirements

Check that the code fulfills the requirements by evaluating associated tests and how well they cover the functionality. This helps ensure that the code meets both the functional and non-functional requirements.

### Performance

Automated tools can only go so far. Performance review might involve checking for inefficient algorithms, slow database queries, or unnecessary data processing, particularly in parts of the system that impact end-users directly.

### Distributed System Concerns

When working with microservices or other distributed systems, reviewers need to consider failure scenarios, such as network timeouts or partial outages. A well-designed system should handle these gracefully.

### Scalability

Make sure the code can handle future demands by evaluating scalability considerations. Code that works well under current conditions might fail as user numbers grow, so reviewers should keep an eye on potential scaling issues.

---

## Wrapping Up

Efficient code review processes combine automated tools with developer expertise. Your team can reduce time spent on repetitive tasks and focus on impactful issues, by using lint checkers, automated testing, code scanning, and architecture tests.

This approach supports CI/CD practices, enabling frequent merges with confidence. Hopefully, no more silly mistakes get pushed uncaught to production!