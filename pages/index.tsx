import type { NextPage } from "next";
import { useCart } from "../src/useCart";

const Home: NextPage = () => {
  const cart = useCart("ck5r8d5b500003f5o2aif0v2b");
  return <div>Total items: {cart?.totalItems}</div>;
};

export default Home;
