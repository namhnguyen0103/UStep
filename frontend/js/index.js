import UserDatabase from "./userdb.js";

document.addEventListener("DOMContentLoaded", function () {
  const accountLink = document.querySelector('a[href="loginPage.html"]');
  const joinNowButton = document.getElementById("joinNowButton");
  const getStartedButton = document.getElementById("getStartedButton");

  checkUserLoggedIn()
    .then((userData) => {
      if (userData) {
        updateUIForLoggedInUser(
          userData,
          accountLink,
          joinNowButton,
          getStartedButton
        );
      }
    })
    .catch((error) => {
      console.error("Error checking login status:", error);
    });

  async function checkUserLoggedIn() {
    const currentUserEmail = localStorage.getItem("currentUser");

    if (!currentUserEmail) {
      return null;
    }

    try {
      const userDB = new UserDatabase("UStepDB");
      const userData = await userDB.getUserByEmail(currentUserEmail);

      if (userData && userData.isLoggedIn) {
        return userData;
      } else {
        localStorage.removeItem("currentUser");
        return null;
      }
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  }

  function updateUIForLoggedInUser(
    userData,
    accountLink,
    joinNowButton,
    getStartedButton
  ) {
    if (accountLink) {
      const accountText = accountLink.querySelector("p");
      if (accountText) {
        accountText.textContent = `${userData.username}'s Account`;
      }
      accountLink.href = "dashboard_final.html";
    }

    if (joinNowButton) {
      joinNowButton.textContent = "My Dashboard";
      joinNowButton.href = "dashboard_final.html";
    }

    if (getStartedButton) {
      getStartedButton.textContent = "Go to Dashboard";
      getStartedButton.href = "dashboard_final.html";
    }
  }
});
