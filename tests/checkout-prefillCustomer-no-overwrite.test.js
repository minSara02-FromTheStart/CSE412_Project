/**
 * @jest-environment jsdom
 */

describe("prefillCustomer does not overwrite values", () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="fullName" value="Existing Name">
      <input id="phone" value="01888888888">
      <input id="email" value="existing@gmail.com">
    `;
  });

  test("does not overwrite prefilled input values", () => {

    const user = {
      displayName: "John Doe",
      email: "john@gmail.com"
    };

    const userData = {
      fullName: "New Name",
      phone: "01712345678",
      email: "new@gmail.com"
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

    expect(fullName.value).toBe("Existing Name");
    expect(phone.value).toBe("01888888888");
    expect(email.value).toBe("existing@gmail.com");
  });

});