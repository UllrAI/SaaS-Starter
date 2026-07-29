import { fireEvent, render, screen } from "@testing-library/react";
import { AdminTableBase } from "./admin-table-base";

describe("AdminTableBase", () => {
  it("forwards controlled search changes immediately", () => {
    const onSearchChange = jest.fn();

    render(
      <AdminTableBase
        columns={[{ key: "name", label: "Name" }]}
        data={[]}
        loading={false}
        error={false}
        searchTerm="initial"
        onSearchChange={onSearchChange}
        pagination={{ page: 1, limit: 20, total: 0, totalPages: 1 }}
        onPageChange={jest.fn()}
      />,
    );

    const searchInput = screen.getByRole("textbox");
    expect(searchInput).toHaveValue("initial");

    fireEvent.change(searchInput, { target: { value: "updated" } });

    expect(onSearchChange).toHaveBeenCalledWith("updated");
  });
});
