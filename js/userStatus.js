import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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


const loginBtn = document.getElementById("loginNavBtn");


onAuthStateChanged(auth, async(user)=>{


    if(!loginBtn) return;


    if(user){


        const userDoc = await getDoc(
            doc(db,"users",user.uid)
        );


        let name = "Customer";


        if(userDoc.exists()){

            name = userDoc.data().fullName;

        }


        // after login
        loginBtn.innerHTML = `👋 Hi, ${name}`;

        loginBtn.href = "logout.html";


    }
    else{


        // before login
        loginBtn.innerHTML = "Buy Now";

        loginBtn.href = "login.html";


    }


});