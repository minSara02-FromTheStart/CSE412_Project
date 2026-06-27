const cartSidebar = document.getElementById("cart-sidebar");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const cartWarning = document.getElementById("cart-warning");


// LOAD CART FROM STORAGE
let cart = JSON.parse(localStorage.getItem("cart")) || [];


// =====================
// OPEN CART
// =====================

function openCart() {

    if (cartSidebar) {

        cartSidebar.classList.add("active");

        if (openCartBtn) {
            openCartBtn.classList.add("hide");
        }


        const productsSection = document.getElementById("products");

        if (productsSection) {
            productsSection.classList.add("products-cart-open");
        }
    }
}


// =====================
// CLOSE CART
// =====================

function closeCart() {

    if (cartSidebar) {

        cartSidebar.classList.remove("active");

        if (openCartBtn) {
            openCartBtn.classList.remove("hide");
        }


        const productsSection = document.getElementById("products");

        if (productsSection) {
            productsSection.classList.remove("products-cart-open");
        }
    }
}


if (openCartBtn) {
    openCartBtn.addEventListener("click", openCart);
}


if (closeCartBtn) {
    closeCartBtn.addEventListener("click", closeCart);
}



// =====================
// CHECKOUT BUTTON STATE
// =====================

function updateCheckoutButton() {

    if (!checkoutBtn) return;


    const cartIsEmpty = cart.length === 0;


    checkoutBtn.disabled = cartIsEmpty;


    if (cartWarning) {

        cartWarning.textContent = cartIsEmpty
            ? "Your cart is empty. Add items before confirming."
            : "";
    }
}




// =====================
// ADD TO CART
// =====================

function addToCart(product, price) {


    const existing =
    cart.find(item => item.product === product);



    if (existing) {

        existing.quantity++;

    } else {


        cart.push({

            product: product,

            price: Number(price),

            quantity: 1
        });
    }



    updateCart();

    openCart();
}





// =====================
// UPDATE CART
// =====================

function updateCart() {


    if (!cartItems || !cartTotal) return;



    cartItems.innerHTML = "";



    let total = 0;



    if (cart.length === 0) {


        cartItems.innerHTML = `

            <p class="empty-summary">
                Your cart is empty. Add products before confirming your order.
            </p>

        `;
    }




    cart.forEach((item,index)=>{


        total += item.price * item.quantity;



        const div =
        document.createElement("div");


        div.classList.add("cart-item");



        div.innerHTML = `

            <h4>${item.product}</h4>


            <p>৳${item.price}</p>



            <div class="quantity-box">


                <button onclick="decreaseQuantity(${index})">
                    -
                </button>



                <span>
                    ${item.quantity}
                </span>



                <button onclick="increaseQuantity(${index})">
                    +
                </button>


            </div>

        `;



        cartItems.appendChild(div);


    });




    cartTotal.innerHTML =
    `Total: ৳${total}`;



    // SAVE CART FOR CHECKOUT
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    localStorage.setItem(
        "cartTotal",
        total
    );



    updateCheckoutButton();

}





// =====================
// QUANTITY
// =====================

function increaseQuantity(index) {

    cart[index].quantity++;

    updateCart();
}



function decreaseQuantity(index) {


    cart[index].quantity--;



    if (cart[index].quantity <= 0) {

        cart.splice(index,1);

    }



    updateCart();
}





// =====================
// CHECKOUT
// =====================

if (checkoutBtn) {


    checkoutBtn.addEventListener(
    "click",
    ()=>{


        if(cart.length === 0){

            updateCheckoutButton();

            return;
        }



        window.location.href =
        "checkout.html";

    });

}





// =====================
// START
// =====================

updateCart();




// =====================
// GLOBAL
// =====================

globalThis.addToCart = addToCart;

globalThis.increaseQuantity = increaseQuantity;

globalThis.decreaseQuantity = decreaseQuantity;