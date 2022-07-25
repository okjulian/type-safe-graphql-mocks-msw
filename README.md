# How to write type safe mocks with MSW and GraphQL Codegen

## Introduction

In this guide, you will set up tests that mock GraphQL responses in a type-safe way using NextJS, Jest, MSW and GraphQL Codegen.

When you're finished, you'll be able to have more confidence in your tests thanks to a typed mocking layer. By adding type safety to your GraphQL mocks, they will match the shape of the GraphQL queries. You won't worry about incorrect mocks in your tests. They will also be easier to write, since Typescript will guide you on what's missing in your fake data.

## Prerequisites

- [React](https://reactjs.org/) for components
- [NextJs](https://nextjs.org/) as a full-stack framework
- [GraphQL](https://graphql.org/) for the API layer
- [Typescript](https://www.typescriptlang.org/) for type checking
- [GraphQL Codegen](https://www.graphql-code-generator.com/) for type generation
- [Jest](https://jestjs.io/) for unit tests
- [MSW](https://mswjs.io/) for mocks

## Step 1 - Displaying cart items

In this step you're going to display cart items in the browser. To do this, you will setup a NextJs application and fetch cart items from a GraphQL API.

First, bootstrap a new NextJs and Typescript application.

```sh
yarn create next-app --typescript type-safe-graphql-mocks-msw
```

The last argument specifies the folder where the application will be created.

Now go to the created folder and start the app in development mode.

```sh
cd type-safe-graphql-mocks-msw
yarn dev
```

You'll see the page running in [http://localhost:3000](http://localhost:3000).

Next, create a top level folder and name it `src`. This is where our components and helpers will be located.

Now create a file inside `src` called `GetCartById.ts`. Export a string containing a query to fetch a cart by id from [https://cartql.com](https://cartql.com).

```ts
export const getCartById = `
  query GetCartById($id: ID!) {
    cart(id: $id) {
      totalItems
      subTotal {
        amount
        formatted
      }
      items {
        id
        name
        quantity
        unitTotal {
          formatted
        }
      }
    }
  }
`;
```

Next you're going to define a new React hook to fetch the cart. Create a new file inside `src` and name it `useCart.ts`.

It exports a function called `useCart` that receives an `id` and returns a `cart`, `null` or `undefined`.

```ts
import { useEffect, useState } from "react";
import { getCartById } from "./GetCartById";

export function useCart(id: string) {
  const [cart, setCart] = useState();

  const variables = {
    id,
  };

  const body = JSON.stringify({ query: getCartById, variables });

  useEffect(() => {
    fetch("https://api.cartql.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    })
      .then((res) => res.json())
      .then(({ data }) => {
        setCart(data.cart);
      });
  }, [body, setCart]);

  return cart;
}
```

Notice that to communicate with the GraphQL API, it uses a simple `fetch` call that sends a query and some variables. Depending on the needs of your application, you would use more elaborate ways of communicating with your API such as [React Query](https://tanstack.com/query/v4/), [Apollo Client](https://www.apollographql.com/docs/react/) or others.

Finally, display the total items in `pages/index.tsx`:

```tsx
import type { NextPage } from "next";
import { useCart } from "../src/useCart";

const Home: NextPage = () => {
  const cart = useCart("ck5r8d5b500003f5o2aif0v2b");
  // @ts-ignore
  return <div>Total items: {cart?.totalItems}</div>;
};

export default Home;
```

Don't freak out about that last `// @ts-ignore`, you will fix that once you add types for the GraphQL API.

In this step, you setup a simple NextJs application that fetches a cart by id. Next step is creating a unit test that verifies this page correctly displays the total items.

## Step 2 - Testing cart items page

In this step you're going to setup Jest to test NextJs pages, and then write a test to verify the functionality of the cart page.

First install Jest, React testing library and a fetch library that works on the testing environment.

```bash
yarn add @testing-library/jest-dom @testing-library/react @testing-library/user-event jest jest-environment-jsdom whatwg-fetch -D
```

Next, define Jest configuration by creating a file called `jest.config.js` and add the following:

```js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {},
  testEnvironment: "jest-environment-jsdom",
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

Create another file called `jest.setup.js` that sets up both React Testing Library and a fetch replacement for the test environment.

```js
import "@testing-library/jest-dom/extend-expect";
import "whatwg-fetch";
```

To finish setting up testing, add a new command to `package.json` called `test` that calls `jest --watchAll`.

Now that tests are set up, you can write a test to verify the functionality of the cart page.

Create a folder called `__tests__` and add a new test called `index.test.tsx`.

This test will render the cart page and verify it displays `Total items:`.

```tsx
import { render, screen } from "@testing-library/react";
import Home from "../pages/index";

describe("Home", () => {
  it("renders total items", () => {
    render(<Home />);

    const totalItems = screen.getByText("Total items:");

    expect(totalItems).toBeInTheDocument();
  });
});
```

Run the test to verify it passes.

```bash
yarn test
```

Notice that the component this test rendered sends an HTTP request to the GraphQL API right after it renders. In the next step you are going to mock this interaction using a library called [MSW](https://mswjs.io).

## Step 3 - Mocking GraphQL query inside test using MSW

In this step you will add a library to your test that intercepts requests and returns mock results. This results in faster and more robust tests. Faster because you cut out the slowest link in this setup, the network. More robust because you get consistent API responses.

First, you will install the MSW library. MSW stands for Mock Service Workers, and it allows you to intercept network calls and replace its responses with mock data.

```bash
yarn add msw --dev
```

Next, you will setup a matcher for the `GetCartById` query that returns a fixed response whenever it intercepts a GraphQL query with that name.

```ts
// ...
const server = setupServer(
  graphql.query("GetCartById", (req, res, ctx) => {
    return res(
      ctx.data({
        cart: { totalItems: 10 },
      })
    );
  })
);
// ...
```

Now that the page under test receives the same value for `cart.totalItems`, you will change the expected test to be `Total items: 10`.

```ts
const totalItems = await waitFor(() => screen.getByText("Total items: 10"));
```

Notice the use of the `waitFor` utility from React Testing Library. It waits for a specific condition to be met before returning the element. This means the test will wait until the mocked API result exists.

This is what `index.test.tsx` looks like now:

```ts
import { render, screen, waitFor } from "@testing-library/react";
import Home from "../pages/index";
import { graphql } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  graphql.query("GetCartById", (req, res, ctx) => {
    return res(
      ctx.data({
        cart: { totalItems: 10 },
      })
    );
  })
);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe("Home", () => {
  it("renders total items", async () => {
    render(<Home />);

    const totalItems = await waitFor(() => screen.getByText("Total items: 10"));

    expect(totalItems).toBeInTheDocument();
  });
});
```

You added mocks for the GraphQL query to your test using MSW. The first step before having type safe mocks is having types, which is what you're going to do next.

## Step 4 - Adding types using GraphQL Codegen

Remember the annoying `// @ts-ignore` in `pages/index.tsx`? That's because `useCart` is not type safe yet. Let's fix that using GraphQL Codegen.

First, install `graphql` as a dependency.

```bash
yarn add graphql
```

Then install GraphQL Codegen CLI, along with the typescript and typescript-operations plugins. These two plugins will generate typescript types based on the GraphQL operations you have, along with your GraphQL schema.

```bash
yarn add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

Configure the generator by creating a file called `codegen.yml` and point it to your schema, operations and where to generate the types.

```yml
schema: https://api.cartql.com
documents: ./src/**/*.ts
generates:
  ./src/types.ts:
    plugins:
      - typescript
      - typescript-operations
```

To finish setting up Codegen, add a new script to `package.json` called `codegen` that calls `graphql-codegen`.

```json
{
  "scripts": {
    "codegen": "graphql-codegen"
  }
}
```

Now run the previous command to generate `src/types.ts`

```bash
yarn codegen
```

You will see a new file called `src/types.ts` in your project, containing types based on the CartQL schema and the `GetCartById` query you have exported in `src/getCartById.ts`.

Add the `getCartById` type to result of `useCart` inside `src/useCart.ts`

```ts
import { useEffect, useState } from "react";
import { getCartById } from "./GetCartById";

export function useCart(id: string) {
  const [cart, setCart] = useState();

  // ...

  return cart as unknown as GetCartByIdQuery["cart"];
}
```

Now you can finally remove `@ts-ignore` when accessing `cart?.totalItems` inside `pages/index.tsx`.

```tsx
import type { NextPage } from "next";
import { useCart } from "../src/useCart";

const Home: NextPage = () => {
  const cart = useCart("ck5r8d5b500003f5o2aif0v2b");
  return <div>Total items: {cart?.totalItems}</div>;
};

export default Home;
```

Thanks to GraphQL Codegen you leverage the GraphQL schema to generate types for your components, no need to manually recreate the API types in Typescript.

Besides using these types in your queries, another place where you can use them is in your mocks and tests. Let's see how to add them next.

## Step 5 - Adding types to the mock data

Like tests, types increase your confidence in your code, so leveraging the power of both techniques is a good idea. Another benefit is a nicer development experience with mock autocompletion.

The MSW library's `graphql.query` request handler can be annotated with types for the response and the variables.

Import the autogenerated `GetCartByIdQuery` type and add it to the request handler inside `__tests__/index.test.tsx`. You will see validation kick in, and indicate that the response needs changes, so go ahead and modify the mock response until the type checker is happy. Even though the test was passing, the mock data needed some tweaks.

This is what `index.test.tsx` should look like now:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import Home from "../pages/index";
import { graphql } from "msw";
import { setupServer } from "msw/node";
import { GetCartByIdQuery } from "../src/types";

const server = setupServer(
  graphql.query<GetCartByIdQuery>("GetCartById", (req, res, ctx) => {
    return res(
      ctx.data({
        cart: {
          totalItems: 10,
          subTotal: { amount: 20000, formatted: "£200.00" },
          items: [
            {
              id: "5e3293a3462051",
              name: "Full Logo Tee",
              quantity: 10,
              unitTotal: { formatted: "£20.00" },
            },
          ],
        },
      })
    );
  })
);

// ...
```

## Conclusion

In this guide, you learned how to use MSW to mock the API calls you need in your tests. Now you can be confident that your tests will pass, and your code will be type safe.
