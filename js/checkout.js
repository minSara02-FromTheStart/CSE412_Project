import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Same Firebase project used across the site (login.html, admin.html, etc.)
const firebaseConfig = {
  apiKey: "AIzaSyAJOWu8ZYEyUms8nF1uVBw2m9v4ApNaT4s",
  authDomain: "nutrinest-408d4.firebaseapp.com",
  projectId: "nutrinest-408d4",
  storageBucket: "nutrinest-408d4.firebasestorage.app",
  messagingSenderId: "44196278510",
  appId: "1:44196278510:web:11acb64840e2d536c843ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const checkoutForm =
document.getElementById("checkoutForm");


const summaryItems =
document.getElementById("summary-items");


const subtotalText =
document.getElementById("subtotal");


const deliveryText =
document.getElementById("delivery");


const grandTotalText =
document.getElementById("grandTotal");


const checkoutMessage =
document.getElementById("checkoutMessage");


const deliveryOptions =
document.querySelectorAll("input[name='delivery']");



const cartItems =
JSON.parse(localStorage.getItem("cart")) || [];


let subtotal =
Number(localStorage.getItem("cartTotal")) || 0;





function formatPrice(amount){

return "৳" + Number(amount).toLocaleString();

}





function renderSummary(){


summaryItems.innerHTML="";



if(cartItems.length===0){


summaryItems.innerHTML=
`
<p class="empty-summary">
No items found in your cart.
</p>
`;

}

else{


cartItems.forEach(item=>{


let quantity=item.quantity || 1;


let itemTotal =
Number(item.price)*quantity;



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







function updateTotal(){


let selected =
document.querySelector(
"input[name='delivery']:checked"
);


let delivery =
Number(selected.value);



let total =
subtotal + delivery;



subtotalText.textContent =
formatPrice(subtotal);


deliveryText.textContent =
delivery===0
?"Free"
:formatPrice(delivery);



grandTotalText.textContent =
formatPrice(total);


}







deliveryOptions.forEach(option=>{


option.addEventListener(
"change",
updateTotal
);


});









function showError(input,message){


let group =
input.closest(".input-group");



group.classList.add("error");



group.querySelector(
".error-message"
).textContent=message;


}






function clearError(input){


let group =
input.closest(".input-group");


group.classList.remove("error");



let msg =
group.querySelector(".error-message");



if(msg){

msg.textContent="";

}


}







function focusError(input){


input.scrollIntoView({

behavior:"smooth",

block:"center"

});


setTimeout(()=>{

input.focus();

},500);


}








function isValidEmail(email){

return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}






function isValidPhone(phone){

return /^01[3-9]\d{8}$/.test(phone);

}





// =====================
// BUILD + SAVE ORDER (Firestore)
// =====================

function getSelectedDeliveryLabel(){

let selected =
document.querySelector("input[name='delivery']:checked");

let label =
selected
? selected.closest(".checkout-option").querySelector("strong").textContent.trim()
: "Standard Delivery";

return label;

}


async function saveOrderToFirestore(formValues){

let selected =
document.querySelector("input[name='delivery']:checked");

let deliveryFee =
Number(selected.value);

let grandTotal =
subtotal + deliveryFee;

// Match the shape admin.js's renderOrders/renderDashboard expect:
// fullName, phone, items:[{name, qty}], grandTotal, deliveryType, status, createdAt
let orderItems =
cartItems.map(item => ({
name: item.product,
qty: item.quantity || 1,
price: Number(item.price)
}));

let orderData = {
fullName: formValues.fullName,
phone: formValues.phone,
email: formValues.email,
address: formValues.address,
notes: formValues.notes,
items: orderItems,
subtotal: subtotal,
deliveryFee: deliveryFee,
deliveryType: getSelectedDeliveryLabel(),
grandTotal: grandTotal,
paymentMethod: "Cash On Delivery",
status: "Pending",
uid: auth.currentUser ? auth.currentUser.uid : null,
createdAt: serverTimestamp()
};

let docRef =
await addDoc(collection(db, "orders"), orderData);

return docRef.id;

}










checkoutForm.addEventListener(
"submit",
async function(e){


e.preventDefault();



let fullName =
document.getElementById("fullName");


let phone =
document.getElementById("phone");


let email =
document.getElementById("email");


let address =
document.getElementById("address");




let valid=true;

let firstError=null;



checkoutMessage.textContent="";



[
fullName,
phone,
email,
address

].forEach(clearError);







if(fullName.value.trim().length<3){

showError(
fullName,
"Please enter your full name."
);

valid=false;

firstError ??= fullName;

}





if(!isValidPhone(phone.value.trim())){


showError(
phone,
"Enter a valid Bangladeshi number."
);


valid=false;


firstError ??= phone;

}






if(!isValidEmail(email.value.trim())){


showError(
email,
"Enter a valid email."
);


valid=false;


firstError ??= email;


}






if(address.value.trim().length<10){


showError(
address,
"Enter complete address."
);


valid=false;


firstError ??= address;


}








if(!valid){


focusError(firstError);

return;


}







let submitBtn =
checkoutForm.querySelector(".place-order");

if(submitBtn){

submitBtn.disabled = true;

submitBtn.textContent = "Placing order...";

}

checkoutMessage.style.color = "";

checkoutMessage.textContent =
"Placing your order...";



try{


await saveOrderToFirestore({

fullName: fullName.value.trim(),

phone: phone.value.trim(),

email: email.value.trim(),

address: address.value.trim(),

notes: document.getElementById("notes")
? document.getElementById("notes").value.trim()
: ""

});



checkoutMessage.textContent =
"Your order has been confirmed successfully!";



localStorage.removeItem("cart");

localStorage.removeItem("cartTotal");



setTimeout(()=>{


window.location.href="index.html";


},2000);


}
catch(err){


console.error("Order save failed:", err);


checkoutMessage.style.color = "#c0392b";

checkoutMessage.textContent =
"Something went wrong placing your order. Please try again.";


if(submitBtn){

submitBtn.disabled = false;

submitBtn.textContent = "Confirm Order";

}


}



});





renderSummary();