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










checkoutForm.addEventListener(
"submit",
function(e){


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







checkoutMessage.textContent =
"Your order has been confirmed successfully!";




localStorage.removeItem("cart");

localStorage.removeItem("cartTotal");



setTimeout(()=>{


window.location.href="index.html";


},2000);




});





renderSummary();