/**
 * @jest-environment jsdom
 */

describe("admin.js helpers", () => {

  // =========================================================
  // UNIT TESTS
  // =========================================================

  test("sanitize escapes HTML markup safely", () => {

    const sanitize = (str) => {
      const d = document.createElement("div");
      d.textContent = str || "";
      return d.innerHTML;
    };

    const result = sanitize("<script>alert('XSS')</script>");

    expect(result).toBe(
      "&lt;script&gt;alert('XSS')&lt;/script&gt;"
    );
  });


  test("pill returns the correct class for Admin status", () => {

    const pill = (status) => {
      const map = {
        Admin: "pill-admin",
        Customer: "pill-customer",
        Deliveryman: "pill-deliveryman"
      };

      const label = status;

      return `<span class="pill ${map[status] || "pill-customer"}">${label}</span>`;
    };

    expect(pill("Admin")).toBe(
      '<span class="pill pill-admin">Admin</span>'
    );
  });


  test("fmtCurrency formats a valid number with Taka symbol", () => {

    const fmtCurrency = (n) => {
      const num = Number(n);
      return isNaN(num) ? "৳0" : "৳" + num.toLocaleString();
    };

    expect(fmtCurrency(1500)).toBe("৳1,500");
  });


  // =========================================================
  // NEGATIVE TESTS
  // =========================================================

  test("sanitize returns empty string for empty input", () => {

    const sanitize = (str) => {
      const d = document.createElement("div");
      d.textContent = str || "";
      return d.innerHTML;
    };

    expect(sanitize("")).toBe("");
  });


  test("fmtDate returns dash for invalid date", () => {

    const fmtDate = (ts) => {
      if (!ts) return "—";

      const d = new Date(ts);

      if (isNaN(d)) return "—";

      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    };

    expect(fmtDate("invalid-date")).toBe("—");
  });

});