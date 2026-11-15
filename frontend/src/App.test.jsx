
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./services/api", () => ({
  analyzeRepository: vi.fn(),
}));

describe("RepoPilot AI Application", () => {
  it("renders the application sidebar", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "RepoPilot" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dashboard")
    ).toBeInTheDocument();
  });

  it("renders the repository intelligence dashboard", () => {
    render(<App />);

    expect(
      screen.getByText("Repository Intelligence")
    ).toBeInTheDocument();
  });
});
