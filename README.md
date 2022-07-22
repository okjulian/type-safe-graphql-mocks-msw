# Type safe GraphQL mocks with MSW and GraphQL Codegen

1. `yarn create next-app --typescript type-safe-graphql-mocks-msw`
2. `cd type-safe-graphql-mocks-msw`
3. `yarn dev`
4. Display total items in `pages/index.tsx`

```tsx
import type { NextPage } from "next";
import { useEffect, useState } from "react";

function useCart(id: string) {
  const [cart, setCart] = useState();
  const query = `
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

  const variables = {
    id,
  };

  const body = JSON.stringify({ query, variables });

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

const Home: NextPage = () => {
  const cart = useCart("ck5r8d5b500003f5o2aif0v2b");
  // @ts-ignore
  return <div>Total items: {cart?.totalItems}</div>;
};

export default Home;
```

5. `yarn add @testing-library/jest-dom @testing-library/react @testing-library/user-event jest jest-environment-jsdom whatwg-fetch -D`
6. `jest.config.js`

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

7. `jest.setup.js`

```js
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
import "whatwg-fetch";
```

8. Add `"test": "jest --watchAll"` to `scripts` in `package.json`
9. Create `__tests__/index.test.tsx`

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

10. `yarn test`
