import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { UploadWorkbench } from "./upload-workbench";

describe("UploadWorkbench", () => {
  it("renders the three demo areas", () => {
    render(<UploadWorkbench />);

    expect(screen.getByText("Default uploader demos")).toBeInTheDocument();
    expect(screen.getByText("Headless example")).toBeInTheDocument();
    expect(screen.getByText("Server-side uploads")).toBeInTheDocument();
  });

  it("renders the available direct upload presets", () => {
    render(<UploadWorkbench />);

    expect(screen.getByRole("tab", { name: "Images" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Batch" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Large" })).toBeInTheDocument();
    expect(screen.getByText("Headless usage")).toBeInTheDocument();
  });
});
