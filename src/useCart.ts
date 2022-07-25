import { useEffect, useState } from "react";
import { getCartById } from "./GetCartById";
import { GetCartByIdQuery } from "./types";

export function useCart(id: string) {
  const [cart, setCart] = useState();
  const query = getCartById;

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

  return cart as unknown as GetCartByIdQuery["cart"];
}
