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
