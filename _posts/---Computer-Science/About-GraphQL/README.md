---
id: 6fabf563-7dd7-4b29-bb22-79df1be18f0f
title: About GraphQL
created_time: 2024-09-13T02:54:00.000Z
last_edited_time: 2024-09-13T02:54:00.000Z
date: 2022-06-21T00:00:00.000Z
thumbnail: ./72514247_zQk8imkX.jfif
type: Post
slug: about-graphql
category: 🤖 Computer Science
tags:
  - GraphQL
  - Rest
summary: Learn GraphQL 🙄
updated_at: 2024-09-13T02:54:00.000Z
author:
  - object: user
    id: e5ed41b6-1017-4d12-bdba-ee217703dd05
status: Public

---

## Getting Started

This time, when I was transferred, I was dealing with GraphQL. I have never actually dealt with GraphQL, so I write it while studying. I will write the actual application later and try to understand the conceptual part now.

The actual grammatical parts are also accurately detailed in the official documentation, so you can refer to them.

## concept

GraphQL is a query language designed to efficiently fetch data created by Facebook. In order to understand GraphQL, it will be easier to understand if you understand it by comparing it with various concepts you already know.

### GraphQL and SQL

As the name suggests, GraphQL is a query language like SQL, which we use to deal with databases. At this time, the query language refers to the language used when dealing with the database. The difference between the two is that in the case of sql, the purpose is to retrieve data stored in the database, and in the case of gql, the web client efficiently retrieves data from the server. It is purpose.

### GraphQLand REST API

If gql is a language made for a web client to get data from a server, let's find out what is different from the REST API we have been using.

In the case of REST API, it has various endpoints by combining URL and method (GET, PUT, POST, DELETE, etc.), whereas gql has only one endpoint and retrieves data from the API through query. made in the form of

Thanks to this difference, when data is fetched through the REST API, **over-fetching**, in which unnecessary data is also received at once, or **under-fetching**, which fetches data through multiple endpoints, can be solved.

## Structure

### query/mutation

The rules were established in the form of querying data and data manipulation through mutation.

The structure of the query is made as follows, and the corresponding response is similar to the structure of the query.

```graphql
{
	people {
		name
		age	
	}
}
```

query

```json
{
	"data" : {
		"people" : {
			"name" : "lee sang min",
			"age" : 10
		}	
	}
}
```

response

```graphql
mutation {
	addPeople(name: "more than min"){
		name
	}
}
```

mutation

### schema

You cannot simply use the queries or mutations described above. You have to define it somewhere, and that is the schema. It is written in schema.graphql, and defines the query, mutation, and type to be used. In simple terms, you can think of writing a description of the data to be used in the schema.

```graphql
type People {
	id: Int!
	name: String!
	age: Int
}

type Query {
	peoples(limit: Int, age: Int): [People]!
	people(id: Int!): People
}
type Mutation {

}

...
```

example

The query or mutation you want to use must be written inside type Query and type Mutation.

### resolver

A resolver is an implementation of a function for an actual schema. You can think of it as implementing the functions of the fields defined in the schema one by one. There may be some inconvenience in having to directly implement the process of importing data, but due to this, it can be implemented regardless of the source of the data. It can be imported from open api implemented as a REST API, or from a general file.

```javascript
import { getPeople } from "./db";

const resolvers = {
  Query:{
    people: (_, {name}) => getUser(name)
  }
}

export default resolvers;
```

example

### introspection

In the existing REST API form, the process of exchanging API specifications was absolutely necessary. However, these factors increase the number of factors to be managed in terms of project management, resulting in deterioration in productivity.

The role of the API specification in these REST APIs is the introspection function of gql. If you use this function, you can see the information of the schema defined in the server, and you can write a query statement accordingly.

## how to use?

As explained earlier, since gql itself is a query language, it is appropriate to use several libraries to actually use it. Representatively, there are Apollo and Relay, but I think you can use them by comparing their pros and cons.

Let's try to apply it to the actual client next time.

## **concluding**

It is said that using gql and apollo in react can completely replace redux, which is based on the existing flux architecture... I think it would be nice to compare what the differences are and what the pros and cons are while actually using it once. Also, I think it may be a little more vulnerable in terms of security, but it would be nice to take a look at this part.

### reference

*   <https://graphql-kr.github.io/learn/queries/>
