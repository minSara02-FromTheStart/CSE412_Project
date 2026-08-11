/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for cart.js
 *
 * cart.js has no module.exports — it runs top-level code immediately
 * (grabs DOM elements, attaches listeners, calls updateCart() once) and
 * exposes addToCart / increaseQuantity / decreaseQuantity on globalThis.
 *
 * Because of that, every test rebuilds the DOM first, then does a fresh
 * jest.resetModules() + require("../cart.js") so the script re-runs
 * against that DOM. This mirrors how the file behaves when a real page
 * loads it via <script src="cart.js"></script>.
 */

const CART_PATH = "../js/cart.js";

function buildDom() {
  document.body.innerHTML = `
    <button id="open-cart-btn">Cart</button>
    <div id="cart-sidebar">
      <button id="close-cart">X</button>
      <div id="cart-items"></div>
      <div id="cart-total"></div>
      <button id="checkout-btn"></button>
      <div id="cart-warning"></div>
    </div>
    <section id="products"></section>
  `;
}

function loadCart() {
  jest.resetModules();
  return require(CART_PATH);
}

function seedStoredCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

beforeEach(() => {
  localStorage.clear();
  buildDom();
});

// =====================================================================
// INITIAL LOAD
// =====================================================================
describe("initial load", () => {
  test("starts with an empty cart when localStorage has nothing", () => {
    loadCart();
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.textContent).toContain("Your cart is empty");
  });

  test("loads an existing cart from localStorage", () => {
    seedStoredCart([{ product: "Almonds", price: 500, quantity: 2 }]);
    loadCart();
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.textContent).toContain("Almonds");
    expect(cartItems.textContent).toContain("2");
  });

  test("renders the total on load based on stored cart", () => {
    seedStoredCart([{ product: "Cashews", price: 300, quantity: 3 }]);
    loadCart();
    const cartTotal = document.getElementById("cart-total");
    expect(cartTotal.innerHTML).toBe("Total: ৳900");
  });

  test("disables the checkout button on load when cart is empty", () => {
    loadCart();
    const checkoutBtn = document.getElementById("checkout-btn");
    expect(checkoutBtn.disabled).toBe(true);
  });

  test("enables the checkout button on load when cart has items", () => {
    seedStoredCart([{ product: "Walnuts", price: 400, quantity: 1 }]);
    loadCart();
    const checkoutBtn = document.getElementById("checkout-btn");
    expect(checkoutBtn.disabled).toBe(false);
  });

  test("does not throw if optional cart DOM elements are missing", () => {
    document.body.innerHTML = "";
    expect(() => loadCart()).not.toThrow();
  });
});

// =====================================================================
// OPEN / CLOSE CART
// =====================================================================
describe("openCart / closeCart", () => {
  test("clicking the open-cart button adds the active class to the sidebar", () => {
    loadCart();
    document.getElementById("open-cart-btn").click();
    expect(document.getElementById("cart-sidebar").classList.contains("active")).toBe(true);
  });

  test("clicking open-cart hides the open-cart button itself", () => {
    loadCart();
    const openBtn = document.getElementById("open-cart-btn");
    openBtn.click();
    expect(openBtn.classList.contains("hide")).toBe(true);
  });

  test("clicking open-cart adds products-cart-open to the products section", () => {
    loadCart();
    document.getElementById("open-cart-btn").click();
    expect(document.getElementById("products").classList.contains("products-cart-open")).toBe(true);
  });

  test("clicking close-cart removes the active class from the sidebar", () => {
    loadCart();
    document.getElementById("open-cart-btn").click();
    document.getElementById("close-cart").click();
    expect(document.getElementById("cart-sidebar").classList.contains("active")).toBe(false);
  });

  test("clicking close-cart un-hides the open-cart button", () => {
    loadCart();
    document.getElementById("open-cart-btn").click();
    document.getElementById("close-cart").click();
    expect(document.getElementById("open-cart-btn").classList.contains("hide")).toBe(false);
  });

  test("clicking close-cart removes products-cart-open from the products section", () => {
    loadCart();
    document.getElementById("open-cart-btn").click();
    document.getElementById("close-cart").click();
    expect(document.getElementById("products").classList.contains("products-cart-open")).toBe(false);
  });

  test("openCart does nothing if the cart sidebar is missing", () => {
    document.getElementById("cart-sidebar").remove();
    loadCart();
    expect(() => document.getElementById("open-cart-btn").click()).not.toThrow();
  });

  test("openCart does not throw if the products section is missing", () => {
    document.getElementById("products").remove();
    loadCart();
    expect(() => document.getElementById("open-cart-btn").click()).not.toThrow();
  });
});

// =====================================================================
// ADD TO CART
// =====================================================================
describe("addToCart", () => {
  test("adds a new product with quantity 1", () => {
    loadCart();
    globalThis.addToCart("Pistachios", 700);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.textContent).toContain("Pistachios");
    expect(cartItems.querySelector(".quantity-box span").textContent.trim()).toBe("1");
  });

  test("coerces a string price into a number", () => {
    loadCart();
    globalThis.addToCart("Dates", "250");
    const cartTotal = document.getElementById("cart-total");
    expect(cartTotal.innerHTML).toBe("Total: ৳250");
  });

  test("increments quantity instead of duplicating an existing product", () => {
    loadCart();
    globalThis.addToCart("Raisins", 150);
    globalThis.addToCart("Raisins", 150);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.querySelectorAll(".cart-item").length).toBe(1);
    expect(cartItems.querySelector(".quantity-box span").textContent.trim()).toBe("2");
  });

  test("opens the cart sidebar automatically", () => {
    loadCart();
    globalThis.addToCart("Figs", 350);
    expect(document.getElementById("cart-sidebar").classList.contains("active")).toBe(true);
  });

  test("persists the updated cart to localStorage", () => {
    loadCart();
    globalThis.addToCart("Apricots", 450);
    const stored = JSON.parse(localStorage.getItem("cart"));
    expect(stored).toEqual([{ product: "Apricots", price: 450, quantity: 1 }]);
  });

  test("enables the checkout button after adding an item", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    expect(document.getElementById("checkout-btn").disabled).toBe(false);
  });

  test("adding two different products keeps them as separate line items", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.addToCart("Cashews", 300);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.querySelectorAll(".cart-item").length).toBe(2);
  });
});

// =====================================================================
// UPDATE CART / TOTAL RENDERING
// =====================================================================
describe("updateCart rendering", () => {
  test("shows the empty-cart message when the cart has no items", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.decreaseQuantity(0);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.textContent).toContain("Your cart is empty");
  });

  test("computes the total across multiple items and quantities", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.addToCart("Cashews", 300);
    globalThis.increaseQuantity(0); // Almonds qty 2 => 1000
    const cartTotal = document.getElementById("cart-total");
    expect(cartTotal.innerHTML).toBe("Total: ৳1300");
  });

  test("renders the product name and price for each item", () => {
    loadCart();
    globalThis.addToCart("Walnuts", 620);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.querySelector("h4").textContent).toBe("Walnuts");
    expect(cartItems.querySelector("p").textContent).toBe("৳620");
  });

  test("does nothing if cart-items or cart-total elements are missing", () => {
    document.getElementById("cart-items").remove();
    loadCart();
    expect(() => globalThis.addToCart("Almonds", 500)).not.toThrow();
  });

  test("saves cartTotal to localStorage as the numeric total", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.addToCart("Almonds", 500);
    expect(localStorage.getItem("cartTotal")).toBe("1000");
  });
});

// =====================================================================
// QUANTITY CONTROLS
// =====================================================================
describe("increaseQuantity / decreaseQuantity", () => {
  test("increaseQuantity increments the item at the given index", () => {
    loadCart();
    globalThis.addToCart("Pecans", 550);
    globalThis.increaseQuantity(0);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.querySelector(".quantity-box span").textContent.trim()).toBe("2");
  });

  test("decreaseQuantity decrements the item at the given index", () => {
    loadCart();
    globalThis.addToCart("Pecans", 550);
    globalThis.increaseQuantity(0);
    globalThis.decreaseQuantity(0);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.querySelector(".quantity-box span").textContent.trim()).toBe("1");
  });

  test("decreaseQuantity removes the item once quantity hits zero", () => {
    loadCart();
    globalThis.addToCart("Pecans", 550);
    globalThis.decreaseQuantity(0);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.querySelectorAll(".cart-item").length).toBe(0);
  });

  test("the +/- buttons rendered in the DOM are wired to the right index", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.addToCart("Cashews", 300);

    const items = document.querySelectorAll(".cart-item");
    const cashewIncreaseBtn = items[1].querySelectorAll("button")[1];
    cashewIncreaseBtn.click();

    const cashewQty = items[1].querySelector(".quantity-box span");
    // NOTE: after DOM re-render this stale reference may detach; re-query fresh
    const freshItems = document.querySelectorAll(".cart-item");
    expect(freshItems[1].querySelector(".quantity-box span").textContent.trim()).toBe("2");
  });

  test("decreasing the only remaining unit updates the total to zero", () => {
    loadCart();
    globalThis.addToCart("Pecans", 550);
    globalThis.decreaseQuantity(0);
    const cartTotal = document.getElementById("cart-total");
    expect(cartTotal.innerHTML).toBe("Total: ৳0");
  });

  test("decreasing one product does not affect a different product's quantity", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.addToCart("Cashews", 300);
    globalThis.decreaseQuantity(0);
    const cartItems = document.getElementById("cart-items");
    expect(cartItems.textContent).toContain("Cashews");
    expect(cartItems.querySelector(".quantity-box span").textContent.trim()).toBe("1");
  });
});

// =====================================================================
// CHECKOUT BUTTON STATE / WARNING TEXT
// =====================================================================
describe("checkout button + warning text", () => {
  test("shows a warning message when the cart is empty", () => {
    loadCart();
    const warning = document.getElementById("cart-warning");
    expect(warning.textContent).toBe("Your cart is empty. Add items before confirming.");
  });

  test("clears the warning message once an item is added", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    const warning = document.getElementById("cart-warning");
    expect(warning.textContent).toBe("");
  });

  test("re-disables checkout and restores the warning after cart empties again", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    globalThis.decreaseQuantity(0);
    expect(document.getElementById("checkout-btn").disabled).toBe(true);
    expect(document.getElementById("cart-warning").textContent).toBe(
      "Your cart is empty. Add items before confirming."
    );
  });

  test("does not throw when cart-warning element is missing", () => {
    document.getElementById("cart-warning").remove();
    expect(() => loadCart()).not.toThrow();
  });
});

// =====================================================================
// CHECKOUT NAVIGATION
// =====================================================================
//
// jsdom doesn't perform real navigation: assigning window.location.href
// just logs a "Not implemented: navigation" error and leaves href
// unchanged, and the property can't be swapped for a stub (it's a
// non-configurable accessor). So instead of reading window.location.href
// back, these tests spy on console.error and confirm whether a
// navigation attempt was made at all -- which is exactly the branch
// cart.js's checkout handler decides between.
describe("checkout button click behavior", () => {
  test("does not attempt navigation when the cart is empty", () => {
    loadCart();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    document.getElementById("checkout-btn").click();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test("attempts navigation when the cart has items", () => {
    loadCart();
    globalThis.addToCart("Almonds", 500);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    document.getElementById("checkout-btn").click();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toMatchObject({ type: "not implemented" });
    errorSpy.mockRestore();
  });

  test("re-runs the empty-cart warning update when clicked while empty", () => {
    loadCart();
    document.getElementById("checkout-btn").click();
    expect(document.getElementById("cart-warning").textContent).toBe(
      "Your cart is empty. Add items before confirming."
    );
  });

  test("does not throw when checkout-btn element is missing", () => {
    document.getElementById("checkout-btn").remove();
    expect(() => loadCart()).not.toThrow();
  });
});

// =====================================================================
// GLOBAL EXPORTS
// =====================================================================
describe("globalThis exposure", () => {
  test("exposes addToCart, increaseQuantity, and decreaseQuantity globally", () => {
    loadCart();
    expect(typeof globalThis.addToCart).toBe("function");
    expect(typeof globalThis.increaseQuantity).toBe("function");
    expect(typeof globalThis.decreaseQuantity).toBe("function");
  });
});


test('addToCart ignores negative price gracefully (does not crash)', () => {
  expect(() => addToCart('Test Item', -100)).not.toThrow();
});



/**
 * @jest-environment jsdom
 */

function buildCartDOM() {
  document.body.innerHTML = `
    <div id="cart-sidebar"></div>
    <button id="open-cart-btn"></button>
    <button id="close-cart"></button>
    <div id="cart-items"></div>
    <h3 id="cart-total"></h3>
    <button id="checkout-btn"></button>
    <p id="cart-warning"></p>
    <section id="products"></section>
  `;
}

function loadCart() {
  jest.resetModules();
  require('../js/cart.js');
}

beforeEach(() => {
  localStorage.clear();
  buildCartDOM();
  loadCart();
});

describe('addToCart', () => {
  // 16
  test('adds an item when cart is empty', () => {
    addToCart('Almonds', 500);
    const cart = JSON.parse(localStorage.getItem('cart'));
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ product: 'Almonds', price: 500, quantity: 1 });
  });

  