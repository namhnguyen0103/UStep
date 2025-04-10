import { UserDatabase } from "./userdb.js";
import { showMessage } from "./utils.js";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signupForm");
  const passwordInput = document.getElementById("password");
  const passwordStrength = document.getElementById("passwordStrength");
  const formMessage = document.getElementById("formMessage");

  function calculatePasswordStrength(password) {
    let strength = 0;

    // length met
    if (password.length >= 8) strength += 1;

    // lowercase char
    if (password.match(/[a-z]+/)) strength += 1;

    // uppercase char
    if (password.match(/[A-Z]+/)) strength += 1;

    // number in pw
    if (password.match(/[0-9]+/)) strength += 1;

    // special char
    if (password.match(/[$@#&!]+/)) strength += 1;

    return strength;
  }

  function updatePasswordStrengthUI(strength) {
    switch (strength) {
      case 0:
      case 1:
        passwordStrength.textContent = "Weak password";
        passwordStrength.className = "password-strength weak";
        break;
      case 2:
      case 3:
        passwordStrength.textContent = "Medium password";
        passwordStrength.className = "password-strength medium";
        break;
      case 4:
      case 5:
        passwordStrength.textContent = "Strong password";
        passwordStrength.className = "password-strength strong";
        break;
    }
  }

  passwordInput.addEventListener("input", function () {
    const password = passwordInput.value;

    if (password.length < 8) {
      showMessage(
        formMessage,
        "Password must be at least 8 characters long",
        "error"
      );
      return;
    }

    // clear any previous error messages
    formMessage.style.display = "none";

    const strength = calculatePasswordStrength(password);
    updatePasswordStrengthUI(strength);
  });

  // form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = passwordInput.value;

    if (username.length < 3) {
      showMessage(
        formMessage,
        "Username must be at least 3 characters long",
        "error"
      );
      return;
    }

    // umass email only
    const umassEmailRegex = /^[^\s@]+@umass\.edu$/i;
    if (!umassEmailRegex.test(email)) {
      showMessage(
        formMessage,
        "Please use a valid umass.edu email address",
        "error"
      );
      return;
    }

    if (password.length < 8) {
      showMessage(
        formMessage,
        "Password must be at least 8 characters long",
        "error"
      );
      return;
    }

    const strength = calculatePasswordStrength(password);

    // must be medium or stronger
    if (strength < 2) {
      showMessage(
        formMessage,
        "Password is too weak. Please include a mix of characters, numbers, or symbols.",
        "error"
      );
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Creating Account...";

    try {
      const userDB = new UserDatabase("UStepDB");
      await userDB.addUser({
        username,
        email,
        password,
        dateCreated: new Date(),
        lastLogin: new Date(),
        isLoggedIn: true,
      });

      showMessage(formMessage, "Account created successfully!", "success");

      submitButton.textContent = "Account Created";

      localStorage.setItem("currentUser", email);

      setTimeout(() => {
        window.location.href = "dashboard_final.html";
      }, 1500);
    } catch (error) {
      console.error("Error creating account:", error);
      showMessage(
        formMessage,
        error.message || "Error creating account. Please try again.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
