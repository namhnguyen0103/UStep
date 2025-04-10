import { UserDatabase } from "./userdb.js";

document.addEventListener("DOMContentLoaded", function () {
  const currentUserEmail = localStorage.getItem("currentUser");
  if (!currentUserEmail) {
    // No user logged in, redirect to login page
    window.location.href = "loginPage.html";
    return;
  }

  const signOutBoxes = document.querySelectorAll(".box h3");
  let signOutBox = null;

  signOutBoxes.forEach((heading) => {
    if (heading.textContent.trim() === "Sign Out") {
      signOutBox = heading.closest(".box");
    }
  });

  if (signOutBox) {
    signOutBox.addEventListener("click", function () {
      logoutUser()
        .then(() => {
          // redirect to home page after logout
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Error during logout:", error);
        });
    });

    signOutBox.style.cursor = "pointer";
  }

  async function logoutUser() {
    const currentUserEmail = localStorage.getItem("currentUser");

    if (!currentUserEmail) {
      // handle no user logged in
      return Promise.resolve();
    }

    try {
      const userDB = new UserDatabase("UStepDB");

      const userData = await userDB.getUserByEmail(currentUserEmail);

      if (userData) {
        userData.isLoggedIn = false;

        await userDB.updateUser(userData);
      }

      localStorage.removeItem("currentUser");

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(`Error during logout: ${error.message}`);
    }
  }
});
