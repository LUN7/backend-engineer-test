# How to run this code

### Install dependencies

```bash
bun install
```

### Start the server

```bash
bun run-docker
```

### Attach tty to the server

```bash
bun attach-log-docker
```

### Run the tests

> Please stop the running server before running the tests

```bash
bun test:unit
```

```bash
bun test:e2e
```

### Postman Collection

You can find the postman collection in the root folder, and import it to your postman.

# Side notes

### Setting up the codebase

- Start this challenge with minimal set up prettier and eslint to help me keep the code consistent.

### Some decision to make

- I will try to finish the challenge with a lean DDD architecture, skipping a trade-off analysis and focus on a good enough structure for review and testability...
- I am going with Postgres, which I am NOT an expert in SQL, but I think it is a good time for me to practice and know more...

### Researching...

- focusing on the behaviour, thus, researching more on UTXO model...

### Drafting...

###### /POST BLOCK API

- Let's starting diving deep into the POST block API...
- Client will provide a Block which contains Transactions, Inputs & Outputs
- Construct the Domain Object, then validate the block and transaction...
- Add a Domain Service, TransactionValidator, to validate the transaction...
- hit a wall, and researching on how to check if output is valid to spend...
- learnt a concept from internet, (Unspent Transaction Output)
- Now, focus on finishing the rest....

### Testing

- So it has been couple of hours since I started this challenge, and I had really focusing on the code, so at this point of moment, I already finished the code. So I am going to write some tests...

###### Unit Tests

- Added unit tests for the domain objects, services
- At this challenge, I am not going to test the DB (repo) layer, and normally, if I use ORM, I will test only when the query is complicated, for example, running some pipeline across multiple entities and have some aggregation logic...
- And for this challenge, I do think there could be test for the repo, as I only use the node-postgres and raw query to query the DB, which is quite error prone, but given the time constraint, I will skip it...

###### E2E Tests

- On the other hand, I added some e2e tests for the api, mainly to cover the happy path, some edge cases and some common error cases.
- As im not very familiar with bun, so I use the most straight forward way to run the e2e, which I started a server and use bun test suit against the native fetch API.
- Thus, the e2e is configured to run in parallel, which you can see in the docker-compose.test-e2e.yaml file.

### Summary

- In summary, this challenge is finished with a lean DDD architecture. Most of the class implement an interface, for the sake of testability, and decoupled from the implementation details. And the instance class is injected manually in the app.ts file.
- So, as I said, I am not an expert in SQL, so I do take some times on researching internet, and try my best to make sure the schema design, query, is as good as I could.
- For simplicity, I use the schema in fastify to validate the request, and assuming all data in the DB will be inserted by this Application, thus, there is no extra validation when data is pull from the DB.
- If I have to make this code production ready, the first thing I would do is to perform some load testing, concurrent write testing, and also some stress testing to make sure the code and query is scalable and reliable.

# EMURGO Backend Engineer Challenge

This challenge is designed to evaluate your skills with data processing and API development. You will be responsible for creating an indexer that will keep track of the balance of each address in a blockchain.

Please read all instructions bellow carefully.

## Instructions

Fork this repository and make the necessary changes to complete the challenge. Once you are done, simply send your repository link to us and we will review it.

## Setup

This coding challenge uses [Bun](https://bun.sh/) as its runtime. If you are unfamiliar with it, you can follow the instructions on the official website to install it - it works pretty much the same as NodeJS, but has a ton of features that make our life easier, like a built-in test engine and TypeScript compiler.

Strictly speaking, because we run this project on Docker, you don't even need to have Bun installed on your machine. You can run the project using the `docker-compose` command, as described below.

The setup for this coding challenge is quite simple. You need to have `docker` and `docker-compose` installed on your machine. If you don't have them installed, you can follow the instructions on the official docker website to install them.

https://docs.docker.com/engine/install/
https://docs.docker.com/compose/install/

Once you have `docker` and `docker-compose` installed, you can run the following command to start the application:

```bash
docker-compose up -d --build
```

or using `Bun`

```bash
bun run-docker
```

## The Challenge

Your job is to create an indexer that will keep track of the current balance for each address. To do that, you will need to implement the following endpoints:

### `POST /blocks`

This endpoint will receive a JSON object that should match the `Block` type from the following schema:

```ts
Output = {
  address: string;
  value: number;
}

Input = {
  txId: string;
  index: number;
}

Transaction = {
  id: string;
  inputs: Array<Input>
  outputs: Array<Output>
}

Block = {
  id: string;
  height: number;
  transactions: Array<Transaction>;
}
```

Based on the received message you should update the balance of each address accordingly. This endpoint should also run the following validations:

- validate if the `height` is exactly one unit higher than the current height - this also means that the first ever block should have `height = 1`. If it is not, you should return a `400` status code with an appropriate message;
- validate if the sum of the values of the inputs is exactly equal to the sum of the values of the outputs. If it is not, you should return a `400` status code with an appropriate message;
- validate if the `id` of the Block correct. For that, the `id` of the block must be the sha256 hash of the sum of its transaction's ids together with its own height. In other words: `sha256(height + transaction1.id + transaction2.id + ... + transactionN.id)`. If it is not, you should return a `400` status code with an appropriate message;

#### Understanding the Schema

If you are familiar with the UTXO model, you will recognize the schema above. If you are not, here is a brief explanation:

- each transaction is composed of inputs and outputs;
- each input is a reference to an output of a previous transaction;
- each output means a given address **received** a certain amount of value;
- from the above, it follows that each input **spends** a certain amount of value from its original address;
- in summary, the balance of an address is the sum of all the values it received minus the sum of all the values it spent;

### `GET /balance/:address`

This endpoint should return the current balance of the given address. Simple as that.

### `POST /rollback?height=number`

This endpoint should rollback the state of the indexer to the given height. This means that you should undo all the transactions that were added after the given height and recalculate the balance of each address. You can assume the `height` will **never** be more than 2000 blocks from the current height.

## Example

Imagine the following sequence of messages:

```json
{
  height: 1,
  transactions: [{
    id: "tx1",
    inputs: [],
    outputs: [{
      address: "addr1",
      value: 10
    }]
  }]
}
// here we have addr1 with a balance of 10

{
  height: 2,
  transactions: [{
    id: "tx2",
    inputs: [{
      txId: "tx1",
      index: 0
    }],
    outputs: [{
      address: "addr2",
      value: 4
    }, {
      address: "addr3",
      value: 6
    }]
  }]
}
// here we have addr1 with a balance of 0, addr2 with a balance of 4 and addr3 with a balance of 6

{
  height: 3,
  transactions: [{
    id: "tx3",
    inputs: [{
      txId: "tx2",
      index: 1
    }],
    outputs: [{
      address: "addr4",
      value: 2
    }, {
      address: "addr5",
      value: 2
    }, {
      address: "addr6",
      value: 2
    }]
  }]
}
// here we have addr1 with a balance of 0, addr2 with a balance of 4, addr3 with a balance of 0 and addr4, addr5 and addr6 with a balance of 2
```

Then, if you receive the request `POST /rollback?height=2`, you should undo the last transaction which will lead to the state where we have addr1 with a balance of 0, addr2 with a balance of 4 and addr3 with a balance of 6.

## Tests

You should write tests for all the operations described above. Anything you put on the `spec` folder in the format `*.spec.ts` will be run by the test engine.

Here we are evaluating your capacity to understand what should be tested and how. Are you going to create abstractions and mock dependencies? Are you going to test the database layer? Are you going to test the API layer? That's all up to you.

## Further Instructions

- We expect you to handle errors and edge cases. Understanding what these are and how to handle them is part of the challenge;
- We provided you with a setup to run the API and a Postgres database together using Docker, as well as some sample code to test the database connection. You can change this setup to use any other database you'd like;
