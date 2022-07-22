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
