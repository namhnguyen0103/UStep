import { UserDatabase } from "./userdb.js";
import { showMessage } from "./utils.js";
import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signupForm");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
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
    passwordStrength.className = "password-strength"; // reset classes
    switch (strength) {
      case 0:
      case 1:
        passwordStrength.textContent = "Weak password";
        passwordStrength.classList.add("weak");
        break;
      case 2:
      case 3:
        passwordStrength.textContent = "Medium password";
        passwordStrength.classList.add("medium");
        break;
      case 4:
      case 5:
        passwordStrength.textContent = "Strong password";
        passwordStrength.classList.add("strong");
        break;
      default:
        passwordStrength.textContent = "";
    }
  }

  passwordInput.addEventListener("input", function () {
    const password = passwordInput.value;

    if (password.length > 0) {
      const strength = calculatePasswordStrength(password);
      updatePasswordStrengthUI(strength);
      if (password.length < 8) {
        showMessage(
          formMessage,
          "Password must be at least 8 characters long",
          "error"
        );
      } else {
        if (formMessage.textContent.includes("8 characters")) {
          formMessage.style.display = "none";
        }
      }
    } else {
      updatePasswordStrengthUI(0);
      formMessage.style.display = "none";
    }
  });

  // form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    formMessage.style.display = "none";

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!firstName || !lastName) {
      showMessage(
        formMessage,
        "Please enter both first and last name",
        "error"
      );
      return;
    }

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

    let backendProfileId = null;

    try {
      console.log("Attempting to create profile on backend...");
      const profileData = {
        email: email,
        first_name: firstName,
        last_name: lastName,
      };

      const response = await fetch(`${BACKEND_URL}/api/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success || !responseData.id) {
        console.error(
          "Backend profile creation failed:",
          response.status,
          responseData
        );
        const errorMessage =
          responseData?.message ||
          `Failed to create profile on server (status: ${response.status}). Please check if the email is already registered or try again later.`;
        throw new Error(errorMessage);
      }

      backendProfileId = responseData.id;
      console.log(
        "Backend profile created successfully. ID:",
        backendProfileId
      );
      submitButton.textContent = "Saving Profile...";

      const userDB = new UserDatabase("UStepDB");
      const userData = {
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        backendId: backendProfileId,
        dateCreated: new Date(),
        lastLogin: new Date(),
        isLoggedIn: true,
      };

      await userDB.addUser(userData);
      console.log("User added to IndexedDB successfully with backend ID.");

      localStorage.setItem("currentUser", email);
      showMessage(formMessage, "Account created successfully!", "success");
      submitButton.textContent = "Account Created!";

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
