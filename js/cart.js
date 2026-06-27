const cartSidebar = document.getElementById("cart-sidebar");

const openCartBtn = document.getElementById("open-cart-btn");

const closeCartBtn = document.getElementById("close-cart");

const cartItems = document.getElementById("cart-items");

const cartTotal = document.getElementById("cart-total");

let cart = [];

/* OPEN CART */

openCartBtn.addEventListener("click", () => {

    cartSidebar.classList.add("active");
});

/* CLOSE CART */

closeCartBtn.addEventListener("click", () => {

    cartSidebar.classList.remove("active");
});


/* ADD TO CART */

function addToCart(product, price){

    const existing = cart.find(item => item.product === product);

    if(existing){

        existing.quantity++;

    }else{

        cart.push({
            product,
            price,
            quantity: 1
        });
    }

    updateCart();
}

/* UPDATE CART */

function updateCart(){

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {

        total += item.price * item.quantity;

        const div = document.createElement("div");

        div.classList.add("cart-item");

        div.innerHTML = `

            <h4>${item.product}</h4>

            <p>৳${item.price}</p>

            <div class="quantity-box">

                <button onclick="decreaseQuantity(${index})">
                    -
                </button>

                <span>${item.quantity}</span>

                <button onclick="increaseQuantity(${index})">
                    +
                </button>

            </div>
        `;

        cartItems.appendChild(div);
    });

    cartTotal.innerHTML = `Total: ৳${total}`;
}

/* INCREASE */

function increaseQuantity(index){

    cart[index].quantity++;

    updateCart();
}

/* DECREASE */

function decreaseQuantity(index){

    cart[index].quantity--;

    if(cart[index].quantity <= 0){

        cart.splice(index, 1);
    }

    updateCart();
}
/* CHECKOUT */

document.getElementById("checkout-btn").addEventListener("click", () => {

    window.location.href = "checkout.html";
});

/* MAKE FUNCTIONS GLOBAL */

globalThis.addToCart = addToCart;
globalThis.increaseQuantity = increaseQuantity;
globalThis.decreaseQuantity = decreaseQuantity;