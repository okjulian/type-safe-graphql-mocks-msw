import { render, screen } from "@testing-library/react";
import Home from "../pages/index";

describe("Home", () => {
  it("renders total items", () => {
    render(<Home />);

    const totalItems = screen.getByText("Total items:");

    expect(totalItems).toBeInTheDocument();
  });
});
