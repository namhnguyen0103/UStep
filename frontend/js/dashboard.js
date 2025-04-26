import { UserDatabase } from "./userdb.js";

async function loadStepData() {
  try {
    const response = await fetch("assets/stepsData.json");
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();
    displayDashboardData(data);
  } catch (error) {
    console.error(
      "There was a problem fetching or processing the step data:",
      error
    );
    displayErrorState();
  }
}

function displayDashboardData(data) {
  updateMetric("total-steps-today", data.today.steps, "steps");
  updateMetric("calories-burned", data.today.calories, "kcal");
  updateMetric("distance-covered", data.today.distance, "km");
  updateMetric("active-minutes", data.today.activeMinutes, "mins");

  const leaderboardBody = document.getElementById("leaderboard-body");
  if (leaderboardBody) {
    leaderboardBody.innerHTML = ""; // clear old leaderboard
    data.leaderboard.forEach((entry) => {
      const row = document.createElement("tr");
      // Highlight your block
      if (entry.name.toLowerCase() === "you") {
        row.style.fontWeight = "bold";
        row.style.backgroundColor = "#fff9c4";
      }
      row.innerHTML = `
          <td>${entry.rank}</td>
          <td>${entry.name}</td>
          <td>${entry.steps.toLocaleString()}</td>
      `;
      leaderboardBody.appendChild(row);
    });
  } else {
    console.error("Leaderboard body not found");
  }

  if (data.dailySteps && data.dailySteps.length > 0) {
    // needed to handle null issues dont remove
    const latestDailySteps = data.dailySteps[data.dailySteps.length - 1].steps;
    updateMetric("daily-step-trend", latestDailySteps, "steps today");
  } else {
    updateMetric("daily-step-trend", "N/A", "");
  }

  updateMetric("weekly-progress", data.weeklyTotalSteps, "steps this week");

  updateElementText("best-streak", data.bestStreak?.toLocaleString() ?? "---");
  updateElementText(
    "record-steps",
    data.recordSteps?.toLocaleString() ?? "---"
  );
  updateElementText("steps-source-value", data.stepsSource ?? "---");
  updateElementText("last-sync-value", data.lastSync ?? "---");
}

function updateMetric(elementId, value, unit) {
  const container = document.getElementById(elementId);
  if (container) {
    const valueEl = container.querySelector(".metric-value");
    const unitEl = container.querySelector(".metric-unit");
    if (valueEl)
      valueEl.textContent =
        value !== null && value !== undefined && value !== "---"
          ? value.toLocaleString()
          : "---";
    if (unitEl) unitEl.textContent = unit;
  } else {
    console.error(`Element with ID ${elementId} not found.`);
  }
}

function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  } else {
    console.error(`Element with ID ${elementId} not found.`);
  }
}

function displayErrorState() {
  updateMetric("total-steps-today", "Error", "");
  updateMetric("calories-burned", "Error", "");
  updateMetric("distance-covered", "Error", "");
  updateMetric("active-minutes", "Error", "");
  const leaderboardBody = document.getElementById("leaderboard-body");
  if (leaderboardBody) {
    leaderboardBody.innerHTML =
      '<tr><td colspan="3">Could not load data.</td></tr>';
  }

  updateMetric("daily-step-trend", "Error", "");
  updateMetric("weekly-progress", "Error", "");
  updateElementText("best-streak", "Error");
  updateElementText("record-steps", "Error");
  updateElementText("steps-source-value", "Error");
  updateElementText("last-sync-value", "Error");
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM fully loaded.");

  const currentUserEmail = localStorage.getItem("currentUser");
  if (!currentUserEmail) {
    console.log("No current user found, redirecting to loginPage.html.");
    window.location.href = "loginPage.html";
    return;
  }

  const usernameDisplay = document.getElementById("username-display");
  if (usernameDisplay) {
    try {
      const userDB = new UserDatabase("UStepDB");
      const userData = await userDB.getUserByEmail(currentUserEmail);
      if (userData && userData.username) {
        usernameDisplay.textContent = userData.username;
      } else {
        // null case
        usernameDisplay.textContent = "User";
      }
    } catch (err) {
      console.error("Failed to get username:", err);
      usernameDisplay.textContent = "User";
    }
  }

  await loadStepData();

  const signOutButton = document.getElementById("sign-out-button");
  if (signOutButton) {
    signOutButton.addEventListener("click", function () {
      console.log("Sign-out button clicked.");
      logoutUser()
        .then(() => {
          console.log("Logout successful. Redirecting to index.html.");
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Error during logout:", error);
          alert("Logout failed. Please try again.");
        });
    });
  } else {
    console.error("Sign-out button not found.");
  }

  async function logoutUser() {
    const currentUserEmail = localStorage.getItem("currentUser");
    if (!currentUserEmail) {
      console.log("No user logged in during logoutUser().");
      // clear local storage just in case
      localStorage.removeItem("currentUser");
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
      console.error("Error during logout database operation:", error);
      // still remove from local storage even if DB fails
      localStorage.removeItem("currentUser");
      return Promise.reject(`Error during logout DB update: ${error.message}`);
    }
  }
});
