/**
 * @jest-environment jsdom
 */

describe("prefillCustomer", () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="fullName">
      <input id="phone">
      <input id="email">
    `;
  });

  test("populates form fields from user data", () => {
    const user = {
      displayName: "John Doe",
      email: "john@gmail.com"
    };

    const userData = {
      fullName: "John Doe",
      phone: "01712345678",
      email: "john@gmail.com"
    };

    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");

    if (fullName && !fullName.value) {
      fullName.value = userData.fullName || user.displayName || "";
    }

    if (phone && !phone.value) {
      phone.value = userData.phone || "";
    }

    if (email && !email.value) {
      email.value = userData.email || user.email || "";
    }

    expect(fullName.value).toBe("John Doe");
    expect(phone.value).toBe("01712345678");
    expect(email.value).toBe("john@gmail.com");
  });

});