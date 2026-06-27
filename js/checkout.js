const checkoutForm = document.getElementById("checkoutForm");

const summaryItems = document.getElementById("summary-items");
const subtotalText = document.getElementById("subtotal");
const deliveryText = document.getElementById("delivery");
const grandTotalText = document.getElementById("grandTotal");
const checkoutMessage = document.getElementById("checkoutMessage");

const deliveryOptions = document.querySelectorAll("input[name='delivery']");


// LOAD CART
const cartItems = JSON.parse(localStorage.getItem("cart")) || [];

let subtotal = Number(localStorage.getItem("cartTotal")) || 0;



function formatPrice(amount) {
    return "৳" + Number(amount).toLocaleString();
}





function renderSummary() {


    summaryItems.innerHTML = "";


    if (cartItems.length === 0) {


        summaryItems.innerHTML =
        `
        <p class="empty-summary">
            No items found in your cart.
        </p>
        `;


    } else {


        cartItems.forEach(item => {


            const quantity = item.quantity || 1;

            const itemTotal =
            Number(item.price) * quantity;



            summaryItems.innerHTML +=
            `
            <div class="summary-item">

                <span>
                    ${item.product} × ${quantity}
                </span>


                <strong>
                    ${formatPrice(itemTotal)}
                </strong>

            </div>
            `;


        });

    }


    updateTotal();

}







function updateTotal() {


    const selectedDelivery =
    document.querySelector(
        "input[name='delivery']:checked"
    );


    const deliveryCharge =
    Number(selectedDelivery.value);



    const total =
    subtotal + deliveryCharge;



    subtotalText.textContent =
    formatPrice(subtotal);



    deliveryText.textContent =
    deliveryCharge === 0
    ? "Free"
    : formatPrice(deliveryCharge);



    grandTotalText.textContent =
    formatPrice(total);

}







deliveryOptions.forEach(option => {


    option.addEventListener(
        "change",
        updateTotal
    );


});








function showError(input,message) {


    const group =
    input.closest(".input-group");


    group.classList.add("error");


    group.querySelector(
        ".error-message"
    ).textContent = message;

}







function clearError(input) {


    const group =
    input.closest(".input-group");


    group.classList.remove("error");


    const msg =
    group.querySelector(".error-message");


    if(msg){
        msg.textContent="";
    }

}








function isValidEmail(email){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}







function isValidPhone(phone){

    return /^01[3-9]\d{8}$/.test(phone);

}









checkoutForm.addEventListener(
"submit",
function(event){


event.preventDefault();



const fullName =
document.getElementById("fullName");


const phone =
document.getElementById("phone");


const email =
document.getElementById("email");


const address =
document.getElementById("address");



let valid = true;



checkoutMessage.textContent = "";



[
fullName,
phone,
email,
address

].forEach(clearError);






if(fullName.value.trim().length < 3){

showError(
fullName,
"Please enter your full name."
);

valid=false;

}





if(!isValidPhone(phone.value.trim())){


showError(
phone,
"Please enter a valid Bangladeshi phone number."
);

valid=false;

}






if(!isValidEmail(email.value.trim())){


showError(
email,
"Please enter a valid email address."
);

valid=false;

}






if(address.value.trim().length < 10){


showError(
address,
"Please enter your complete delivery address."
);

valid=false;

}






if(!valid){
return;
}






checkoutMessage.textContent =
"Your order has been confirmed successfully. We will contact you shortly.";



// CLEAR CART AFTER ORDER

localStorage.removeItem("cart");

localStorage.removeItem("cartTotal");



setTimeout(()=>{

    window.location.href="index.html";

},2000);



});








renderSummary();