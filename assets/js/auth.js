// login //
// ফর্ম টগল করার ফাংশন (লগইন থেকে রেজিস্টার এবং রেজিস্টার থেকে লগইন ভিউ)
// ফর্ম টগল করার ফাংশন (লগইন এবং রেজিস্ট্রেশন ভিউ পরিবর্তন)
function toggleForm(formType) {
    const loginF = document.getElementById("loginForm");
    const registerF = document.getElementById("registerForm");

    if (formType === 'register') {
        loginF.classList.remove("active");
        registerF.classList.add("active");
    } else {
        registerF.classList.remove("active");
        loginF.classList.add("active");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // ১. রেজিস্ট্রেশন ফর্ম সাবমিট হ্যান্ডলার
    const formRegister = document.getElementById("formRegister");
    if (formRegister) {
        formRegister.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value.trim();
            const regError = document.getElementById("regError");

            // লোকাল স্টোরেজ থেকে ইউজার লিস্ট নেওয়া
            let users = JSON.parse(localStorage.getItem("usersList")) || [];

            // ইমেইল অলরেডি রেজিস্টার্ড কিনা চেক করা
            const userExists = users.some(u => u.email === email);
            if (userExists) {
                regError.innerText = "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে!";
                return;
            }

            // নতুন ইউজার অবজেক্ট তৈরি করে লিস্টে যোগ করা
            const newUser = {
                name: name,
                email: email,
                password: password,
                image: "https://via.placeholder.com/150" // ডিফল্ট প্রোফাইল ছবি
            };

            users.push(newUser);
            localStorage.setItem("usersList", JSON.stringify(users));

            alert("সফলভাবে অ্যাকাউন্ট তৈরি হয়েছে! এখন লগইন করুন।");
            formRegister.reset();
            toggleForm('login'); // লগইন ফর্মে রিডাইরেক্ট করা
        });
    }

    // ২. লগইন ফর্ম সাবমিট হ্যান্ডলার
    const formLogin = document.getElementById("formLogin");
    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("loginEmail").value.trim();
            const passwordInput = document.getElementById("loginPassword").value.trim();
            const loginError = document.getElementById("loginError");

            // লোকাল স্টোরেজ থেকে ইউজার লিস্ট নেওয়া
            const users = JSON.parse(localStorage.getItem("usersList")) || [];

            // ইউজার এবং পাসওয়ার্ড ম্যাচ করা
            const foundUser = users.find(u => u.email === emailInput || u.name === emailInput);

            if (!foundUser) {
                loginError.innerText = "ইউজারনেম অথবা ইমেইল পাওয়া যায়নি!";
                return;
            }

            if (foundUser.password !== passwordInput) {
                loginError.innerText = "ভুল পাসওয়ার্ড দেওয়া হয়েছে!";
                return;
            }

            // সফল লগইন হলে loggedInUser হিসেবে ডাটা স্টোর করা
            localStorage.setItem("loggedInUser", JSON.stringify(foundUser));

            alert("লগইন সফল হয়েছে!");

            // ড্যাশবোর্ড পেজে রিডাইরেক্ট করা
            window.location.href = "dashboard.html";
        });
    }
});