import { UserDatabase } from "./userdb.js";
import { BACKEND_URL } from "./config.js";

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadTodaysStepData(backendId) {
  if (!backendId) {
    console.error("Cannot fetch today's steps without a backendId.");
    const editBtn = document.getElementById("edit-steps-button");
    if (editBtn) editBtn.disabled = true;
    return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
  }

  const todayDateString = getTodayDateString();
  const apiUrl = `${BACKEND_URL}/api/profiles/${backendId}/steps`;
  console.log(
    `Fetching today's steps from: ${apiUrl} for date: ${todayDateString}`
  );

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(
        `API error fetching steps: ${response.status} ${response.statusText}`
      );
      try {
        const errorData = await response.json();
        console.error("API error details:", errorData);
      } catch (parseError) {}
      const editBtn = document.getElementById("edit-steps-button");
      if (editBtn) editBtn.disabled = true;
      return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
    }

    // [{ date: "YYYY-MM-DD", steps: N, id: "uuid", profileId: "uuid" }, ...]
    const stepEntries = await response.json();

    if (!Array.isArray(stepEntries)) {
      console.error("API response for steps is not an array:", stepEntries);
      const editBtn = document.getElementById("edit-steps-button");
      if (editBtn) editBtn.disabled = true;
      return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
    }

    const todayEntry = stepEntries.find(
      (entry) => entry.date === todayDateString
    );

    if (todayEntry && typeof todayEntry.steps === "number") {
      console.log("Found today's step entry:", todayEntry);
      const editBtn = document.getElementById("edit-steps-button");
      if (editBtn) editBtn.disabled = false;

      return {
        steps: todayEntry.steps,
        calories: 0, // Placeholder
        distance: 0, // Placeholder
        activeMinutes: 0, // Placeholder
      };
    } else {
      console.log("No step entry found for today:", todayDateString);
      const editBtn = document.getElementById("edit-steps-button");
      if (editBtn) editBtn.disabled = false;
      return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
    }
  } catch (error) {
    console.error("Network or other error fetching today's step data:", error);
    const editBtn = document.getElementById("edit-steps-button");
    if (editBtn) editBtn.disabled = true;
    return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
  }
}

async function saveTodaysSteps(backendId, newSteps) {
  if (!backendId) {
    console.error("Cannot save steps without backendId.");
    return { success: false, message: "User ID missing." };
  }
  if (
    newSteps === null ||
    newSteps === undefined ||
    isNaN(newSteps) ||
    newSteps < 0
  ) {
    console.error("Invalid step count provided:", newSteps);
    return {
      success: false,
      message: "Invalid step count. Must be 0 or greater.",
    };
  }

  const todayDateString = getTodayDateString();
  const apiUrl = `${BACKEND_URL}/api/profiles/${backendId}/steps`;
  const stepsPayload = {
    date: todayDateString,
    steps: Math.round(newSteps),
  };

  console.log(`Saving steps to: ${apiUrl}`, stepsPayload);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stepsPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(
        `API error saving steps: ${response.status} ${response.statusText}`,
        responseData
      );
      const message =
        responseData?.message ||
        `Server error (${response.status}). Could not save steps.`;
      return { success: false, message: message };
    }

    if (
      responseData.success === true ||
      response.status === 200 ||
      response.status === 201
    ) {
      console.log("Steps saved successfully via API:", responseData);
      return {
        success: true,
        message: "Steps saved!",
        savedSteps: stepsPayload.steps,
      };
    } else {
      console.warn(
        "API response OK, but potentially unsuccessful:",
        responseData
      );
      return {
        success: false,
        message: responseData?.message || "Could not confirm save.",
      };
    }
  } catch (error) {
    console.error("Network or other error saving step data:", error);
    return { success: false, message: "Network error. Could not save steps." };
  }
}

async function loadStaticDashboardData() {
  try {
    const response = await fetch("assets/stepsData.json");
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();

    return {
      dailySteps: data.dailySteps,
      weeklyTotalSteps: data.weeklyTotalSteps,
      leaderboard: data.leaderboard,
      bestStreak: data.bestStreak,
      recordSteps: data.recordSteps,
      stepsSource: data.stepsSource,
      lastSync: data.lastSync,
    };
  } catch (error) {
    console.error(
      "There was a problem fetching or processing the step data:",
      error
    );
    return null;
  }
}

function displayDashboardData(todaysMetrics, staticData) {
  const safeMetrics = todaysMetrics || {
    steps: 0,
    calories: 0,
    distance: 0,
    activeMinutes: 0,
  };
  updateMetric("total-steps-today", safeMetrics.steps, "steps");
  updateMetric("calories-burned", safeMetrics.calories, "kcal");
  updateMetric("distance-covered", safeMetrics.distance, "km");
  updateMetric("active-minutes", safeMetrics.activeMinutes, "mins");

  const editBtn = document.getElementById("edit-steps-button");
  const canEdit = todaysMetrics !== null;
  if (editBtn) {
    editBtn.disabled = !canEdit;
    if (!canEdit) {
      console.log("Disabling edit button because initial step load failed.");
    }
  }

  if (staticData) {
    const leaderboardBody = document.getElementById("leaderboard-body");
    if (leaderboardBody) {
      leaderboardBody.innerHTML = ""; // clear old leaderboard
      if (staticData.leaderboard && staticData.leaderboard.length > 0) {
        staticData.leaderboard.forEach((entry) => {
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
        leaderboardBody.innerHTML =
          '<tr><td colspan="3">Leaderboard data unavailable.</td></tr>';
      }
    } else {
      console.error("Leaderboard body not found");
    }

    updateMetric("daily-step-trend", safeMetrics.steps, "steps today");

    updateMetric(
      "weekly-progress",
      staticData.weeklyTotalSteps ?? "---",
      "steps this week"
    );

    updateElementText(
      "best-streak",
      staticData.bestStreak?.toLocaleString() ?? "---"
    );
    updateElementText(
      "record-steps",
      staticData.recordSteps?.toLocaleString() ?? "---"
    );

    updateElementText("steps-source-value", staticData.stepsSource ?? "---");
    updateElementText("last-sync-value", staticData.lastSync ?? "---");

    // TODO: Update graph placeholders using staticData.dailySteps or future API data
  } else {
    // handle case where static data failed to load
    console.error(
      "Static dashboard data failed to load. Displaying placeholders."
    );

    const leaderboardBody = document.getElementById("leaderboard-body");
    if (leaderboardBody)
      leaderboardBody.innerHTML =
        '<tr><td colspan="3">Could not load leaderboard data.</td></tr>';
    updateMetric("daily-step-trend", safeMetrics.steps, "steps today");
    updateMetric("weekly-progress", "---", "steps this week");
    updateElementText("best-streak", "---");
    updateElementText("record-steps", "---");
    updateElementText("steps-source-value", "---");
    updateElementText("last-sync-value", "---");
  }
}

function updateMetric(elementId, value, unit) {
  const container = document.getElementById(elementId);
  if (container) {
    const valueEl = container.querySelector(".metric-value");
    const unitEl = container.querySelector(".metric-unit");
    if (valueEl)
      valueEl.textContent =
        value !== null && value !== undefined && !isNaN(value)
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

function displayErrorState(message = "Could not load dashboard data.") {
  console.error("Displaying error state:", message);
  updateMetric("total-steps-today", "Error", "");
  updateMetric("calories-burned", "Error", "");
  updateMetric("distance-covered", "Error", "");
  updateMetric("active-minutes", "Error", "");

  const editBtn = document.getElementById("edit-steps-button");
  if (editBtn) editBtn.disabled = true;

  const leaderboardBody = document.getElementById("leaderboard-body");
  if (leaderboardBody) {
    leaderboardBody.innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
  }
  updateMetric("daily-step-trend", "Error", "");
  updateMetric("weekly-progress", "Error", "");
  updateElementText("best-streak", "Error");
  updateElementText("record-steps", "Error");
  updateElementText("steps-source-value", "Error");
  updateElementText("last-sync-value", "Error");

  const dailyGraph = document.getElementById("daily-trend-graph");
  if (dailyGraph)
    dailyGraph.innerHTML =
      '<p style="font-size: 12px; margin-top: 10px; color: red;">Graph Error</p>';
  const weeklyGraph = document.getElementById("weekly-progress-graph");
  if (weeklyGraph)
    weeklyGraph.innerHTML =
      '<p style="font-size: 12px; margin-top: 10px; color: red;">Graph Error</p>';
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM fully loaded.");

  let backendId = null;
  let currentTodaysSteps = 0;

  const displayContainer = document.getElementById("display-steps-container");
  const editContainer = document.getElementById("edit-steps-container");
  const editStepsButton = document.getElementById("edit-steps-button");
  const saveStepsButton = document.getElementById("save-steps-button");
  const cancelStepsButton = document.getElementById("cancel-steps-button");
  const editStepsInput = document.getElementById("edit-steps-input");
  const editStepsMessage = document.getElementById("edit-steps-message");

  function showEditMode() {
    editStepsInput.value = currentTodaysSteps;
    displayContainer.style.display = "none";
    editContainer.style.display = "block";
    editStepsMessage.textContent = "";
    saveStepsButton.disabled = false;
    cancelStepsButton.disabled = false;
    editStepsInput.focus();
  }

  function showDisplayMode(steps) {
    updateMetric("total-steps-today", steps, "steps");
    updateMetric("daily-step-trend", steps, "steps today");

    editContainer.style.display = "none";
    displayContainer.style.display = "block";
    editStepsMessage.textContent = "";
  }

  if (editStepsButton) {
    editStepsButton.addEventListener("click", () => {
      console.log("Edit button clicked. Current steps:", currentTodaysSteps);
      showEditMode();
    });
  }

  if (cancelStepsButton) {
    cancelStepsButton.addEventListener("click", () => {
      console.log("Cancel button clicked.");
      showDisplayMode(currentTodaysSteps);
    });
  }

  if (saveStepsButton) {
    saveStepsButton.addEventListener("click", async () => {
      const newStepsValue = editStepsInput.value.trim();
      const newSteps = parseInt(newStepsValue, 10);

      console.log("Save button clicked. Input value:", newStepsValue);

      if (isNaN(newSteps) || newSteps < 0 || newStepsValue === "") {
        editStepsMessage.textContent =
          "Please enter a valid number (0 or greater).";
        return;
      }

      saveStepsButton.disabled = true;
      cancelStepsButton.disabled = true;
      editStepsMessage.textContent = "Saving...";

      const result = await saveTodaysSteps(backendId, newSteps);

      if (result.success) {
        currentTodaysSteps = result.savedSteps;
        editStepsMessage.textContent = "Saved!";
        setTimeout(() => {
          showDisplayMode(currentTodaysSteps);
        }, 1000);
      } else {
        editStepsMessage.textContent = `Error: ${result.message}`;
        saveStepsButton.disabled = false;
        cancelStepsButton.disabled = false;
      }
    });
  }

  const currentUserEmail = localStorage.getItem("currentUser");
  if (!currentUserEmail) {
    console.log("No current user found, redirecting to loginPage.html.");
    window.location.href = "loginPage.html";
    return;
  }

  const userEmailDisplay = document.getElementById("user-email-display");

  try {
    const userDB = new UserDatabase("UStepDB");
    const userData = await userDB.getUserByEmail(currentUserEmail);

    if (userData && userData.email) {
      if (userEmailDisplay)
        userEmailDisplay.textContent = userData.firstName || userData.email;

      if (userData.backendId) {
        backendId = userData.backendId;
        console.log("User Backend ID found:", backendId);

        const [todaysMetrics, staticData] = await Promise.all([
          loadTodaysStepData(backendId),
          loadStaticDashboardData(),
        ]);

        if (todaysMetrics) {
          currentTodaysSteps = todaysMetrics.steps;
        } else {
          currentTodaysSteps = 0;
          if (editStepsButton) editStepsButton.disabled = true;
          console.warn("Initial load for today's metrics failed.");
        }

        if (staticData === null) {
          console.warn(
            "Static data failed to load, some dashboard sections might be empty."
          );
          displayDashboardData(todaysMetrics, null);
        } else {
          displayDashboardData(todaysMetrics, staticData);
        }
      } else {
        // user exists locally but is missing backendId
        console.error(
          "Backend ID not found for logged-in user:",
          currentUserEmail
        );
        if (userEmailDisplay) userEmailDisplay.textContent = userData.email;
        displayErrorState(
          "User profile data is incomplete. Cannot load dashboard."
        );
      }
    } else {
      console.error(
        "User data not found in local DB for email:",
        currentUserEmail
      );
      if (userEmailDisplay) userEmailDisplay.textContent = "Error";
      localStorage.removeItem("currentUser");
      displayErrorState("Failed to load user data. Please log in again.");
      // go back to login
      setTimeout(() => {
        window.location.href = "loginPage.html";
      }, 2000);
    }
  } catch (err) {
    console.error("Failed to get user data from DB or load dashboard:", err);
    if (userEmailDisplay) userEmailDisplay.textContent = "Error";
    displayErrorState("An error occurred while loading your dashboard.");
  }
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
        console.log("User data updated in the database (logged out).");
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
