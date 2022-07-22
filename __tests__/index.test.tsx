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
