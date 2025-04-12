import { UserDatabase } from "./userdb.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded.");

  const currentUserEmail = localStorage.getItem("currentUser");
  if (!currentUserEmail) {
    console.log("No current user found, redirecting to loginPage.html.");
    window.location.href = "loginPage.html";
    return;
  }

  const signOutBox = document.querySelector(".box.sign-out");
  if (signOutBox) {
    signOutBox.style.cursor = "pointer";
    signOutBox.addEventListener("click", function () {
      console.log("Sign-out box clicked.");
      logoutUser()
        .then(() => {
          console.log("Logout successful. Redirecting to index.html.");
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Error during logout:", error);
        });
    });
  } else {
    console.error("Sign-out box not found.");
  }

  async function logoutUser() {
    const currentUserEmail = localStorage.getItem("currentUser");
    if (!currentUserEmail) {
      console.log("No user logged in during logoutUser().");
      return Promise.resolve();
    }
    try {
      const userDB = new UserDatabase("UStepDB");
      const userData = await userDB.getUserByEmail(currentUserEmail);
      if (userData) {
        userData.isLoggedIn = false;
        await userDB.updateUser(userData);
        console.log("User data updated in the database.");
      }
      localStorage.removeItem("currentUser");
      console.log("Current user removed from localStorage.");
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(`Error during logout: ${error.message}`);
    } 
  }
});



