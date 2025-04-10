import UserDatabase from "./userdb.js";
import { showMessage } from "./utils.js";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const formMessage = document.createElement("div");
  formMessage.className = "form-message";
  form.appendChild(formMessage);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage(formMessage, "Please enter both email and password", "error");
      return;
    }

    // loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";

    try {
      const userDB = new UserDatabase("UStepDB");

      let userData;
      if (email.includes("@")) {
        // input is an email
        userData = await userDB.getUserByEmail(email);
      } else {
        // input is a username
        userData = await userDB.getUserByUsername(email);
      }

      if (!userData) {
        showMessage(
          formMessage,
          "User not found. Please check your credentials.",
          "error"
        );
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      if (userData.password !== password) {
        showMessage(
          formMessage,
          "Incorrect password. Please try again.",
          "error"
        );
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      userData.isLoggedIn = true;
      userData.lastLogin = new Date();

      await userDB.updateUser(userData);

      localStorage.setItem("currentUser", userData.email);

      showMessage(formMessage, "Login successful!", "success");
      submitButton.textContent = "Login Successful";

      setTimeout(() => {
        window.location.href = "dashboard_final.html";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      showMessage(
        formMessage,
        error.message || "Error during login. Please try again.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
