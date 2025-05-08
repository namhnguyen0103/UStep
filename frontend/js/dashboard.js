import { UserDatabase } from "./userdb.js";
import { BACKEND_URL } from "./config.js";

// ─── Helpers to show record & best streak in the DOM ──────────────────
function showRecord(record) {
  const el = document.getElementById("record-steps");
  if (el) el.textContent = record.toLocaleString();
}
function showBestStreak(days) {
  const el = document.getElementById("best-streak");
  if (el) el.textContent = days;
}

/**
 * Given an array of { date: 'YYYY-MM-DD', steps: Number },
 * sorted from most-recent to oldest, compute the
 * longest run of consecutive days.
 */
/**
 * entries: Array<{date: 'YYYY-MM-DD', steps: number}>
 * returns the longest run of consecutive days.
 */

async function updateRecordAndStreak(backendId) {
  try {
    // grab all entries
    const allEntries = await fetch(`${BACKEND_URL}/api/profiles/${backendId}/steps`)
                              .then(r => r.ok ? r.json() : Promise.reject(r.status));
    // record = highest daily steps
    const record = allEntries.length
      ? Math.max(...allEntries.map(e => e.steps))
      : 0;
    // streak = longest run
    const streak = computeBestStreak(allEntries);

    // paint
    showRecord(record);
    showBestStreak(streak);
  } catch (err) {
    console.error("Error updating record & streak:", err);
  }
}



function computeBestStreak(entries) {
  if (!entries || entries.length === 0) return 0;

  // 1) sort newest → oldest
  const sorted = entries
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // 2) walk the sorted array, counting runs where day difference === 1
  let maxStreak = 0;
  let currStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currStreak);
      currStreak = 1;
    }
  }

  return Math.max(maxStreak, currStreak);
}


function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekArray() {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay())
  const weekArr = []
  for (let i = 0; i < 7; i++) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    weekArr.push(`${year}-${month}-${day}`);
    date.setDate(date.getDate() + 1);
  }
  return weekArr
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
      } catch (parseError) { }
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

async function getWeekStepData(backendId) {
  const weekArr = getWeekArray();

  if (!backendId) {
    console.error("Cannot fetch today's this week's steps without a backendId.");
    return weekArr.map(day => [day, 0]);
  }

  const apiUrl = `${BACKEND_URL}/api/profiles/${backendId}/steps`;
  console.log(
    `Fetching this week's steps from: ${apiUrl}`
  );

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(
        `API error fetching this week's steps: ${response.status} ${response.statusText}`
      );
      try {
        const errorData = await response.json();
        console.error("API error details:", errorData);
      } catch (parseError) { }
      return weekArr.map(day => [day, 0]);
    }

    // [{ date: "YYYY-MM-DD", steps: N, id: "uuid", profileId: "uuid" }, ...]
    const stepEntries = await response.json();

    if (!Array.isArray(stepEntries)) {
      console.error("API response for this week's steps is not an array:", stepEntries);
      return weekArr.map(day => [day, 0]);
    }

    const weekEntry = stepEntries.filter((entry) => weekArr.includes(entry.date))

    if (weekEntry) {
      console.log("Found this week's steps entry:", weekEntry);
      return weekArr.map(day => {
        const entry = weekEntry.find(e => e.date === day)
        if (entry)
          return [day, entry.steps];
        else
          return [day, 0];
      })
    } else {
      console.log("No week steps entry found for today:", todayDateString);
      return weekArr.map(day => [day, 0]);
    }
  } catch (error) {
    console.error("Network or other error fetching week's step data:", error);
    return weekArr.map(day => [day, 0]);
  }
}

async function loadTodaysCalorieData(backendId) {
  if (!backendId) {
    console.error("Cannot fetch today's calories without a backendId.");
    const editBtn = document.getElementById("edit-calories-button");
    if (editBtn) editBtn.disabled = true;
    return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
  }

  const todayDateString = getTodayDateString();
  const apiUrl = `${BACKEND_URL}/api/profiles/${backendId}/calories`;
  console.log(
    `Fetching today's calories from: ${apiUrl} for date: ${todayDateString}`
  );

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(
        `API error fetching calories: ${response.status} ${response.statusText}`
      );
      try {
        const errorData = await response.json();
        console.error("API error details:", errorData);
      } catch (parseError) { }
      const editBtn = document.getElementById("edit-calories-button");
      if (editBtn) editBtn.disabled = true;
      return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
    }

    // [{ date: "YYYY-MM-DD", steps: N, id: "uuid", profileId: "uuid" }, ...]
    const calorieEntries = await response.json();

    if (!Array.isArray(calorieEntries)) {
      console.error("API response for calories is not an array:", calorieEntries);
      const editBtn = document.getElementById("edit-calories-button");
      if (editBtn) editBtn.disabled = true;
      return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
    }

    const todayEntry = calorieEntries.find(
      (entry) => entry.date === todayDateString
    );

    if (todayEntry && typeof todayEntry.calories === "number") {
      console.log("Found today's calorie entry:", todayEntry);
      const editBtn = document.getElementById("edit-calories-button");
      if (editBtn) editBtn.disabled = false;

      return {
        steps: 0, // Placeholder
        calories: todayEntry.calories, // Placeholder
        distance: 0, // Placeholder
        activeMinutes: 0, // Placeholder
      };
    } else {
      console.log("No calorie entry found for today:", todayDateString);
      const editBtn = document.getElementById("edit-calories-button");
      if (editBtn) editBtn.disabled = false;
      return { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
    }
  } catch (error) {
    console.error("Network or other error fetching today's step data:", error);
    const editBtn = document.getElementById("edit-calories-button");
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

async function saveTodaysCalories(backendId, newCalories) {
  if (!backendId) {
    console.error("Cannot save steps without backendId.");
    return { success: false, message: "User ID missing." };
  }
  if (
    newCalories === null ||
    newCalories === undefined ||
    isNaN(newCalories) ||
    newCalories < 0
  ) {
    console.error("Invalid calorie value provided:", newCalories);
    return {
      success: false,
      message: "Invalid calories value. Must be 0 or greater.",
    };
  }

  const todayDateString = getTodayDateString();
  const apiUrl = `${BACKEND_URL}/api/profiles/${backendId}/calories`;
  const caloriesPayload = {
    date: todayDateString,
    calories: Math.round(newCalories),
  };

  console.log(`Saving calories to: ${apiUrl}`, caloriesPayload);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(caloriesPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(
        `API error saving calories: ${response.status} ${response.statusText}`,
        responseData
      );
      const message =
        responseData?.message ||
        `Server error (${response.status}). Could not save calories.`;
      return { success: false, message: message };
    }

    if (
      responseData.success === true ||
      response.status === 200 ||

      response.status === 201
    ) {
      console.log("Calories saved successfully via API:", responseData);
      return {
        success: true,
        message: "Calories saved!",
        savedCalories: caloriesPayload.calories,
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
    console.error("Network or other error saving calorie data:", error);
    return { success: false, message: "Network error. Could not save calories." };
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

async function loadLeaderboardData(backendId) {
  if (!backendId) {
    console.error("Cannot fetch leaderboard without a backendId.");
    return null;
  }

  const apiUrl = `${BACKEND_URL}/api/leaderboard/${backendId}`;
  console.log(`Fetching leaderboard from: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`API error fetching leaderboard: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      console.error("API returned unsuccessful response:", data);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Network or other error fetching leaderboard:", error);
    return null;
  }
}

function displayLeaderboardData(leaderboardData, backendId) {
  const leaderboardBody = document.getElementById("leaderboard-body");
  if (leaderboardBody) {
    leaderboardBody.innerHTML = ""; // clear old leaderboard
    if (leaderboardData && leaderboardData.leaderboard && leaderboardData.leaderboard.length > 0) {
      leaderboardData.leaderboard.forEach((entry) => {
        const row = document.createElement("tr");
        // Highlight current user
        if (entry.userId === backendId) {
          row.style.fontWeight = "bold";
          row.style.backgroundColor = "#fff9c4";
        }
        row.innerHTML = `
          <td>${entry.rank}</td>
          <td>${entry.username}</td>
          <td>${entry.totalSteps.toLocaleString()}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    } else {
      leaderboardBody.innerHTML = '<tr><td colspan="3">Leaderboard data unavailable.</td></tr>';
    }
  }
}

async function displayDashboardData(todaysMetrics, staticData, backendId) {
  const safeMetrics = todaysMetrics || {
    steps: 0,
    calories: 0,
    distance: 0,
    activeMinutes: 0,
    weekSteps: 0
  };

  // Update basic metrics
  updateMetric("display-steps-container", safeMetrics.steps, "steps");
  updateMetric("display-calories-container", safeMetrics.calories, "kcal");
  updateMetric("distance-covered", safeMetrics.steps * 2.4, "meters");
  updateMetric("active-minutes", Math.ceil(safeMetrics.steps / 100), "mins");
  updateMetric("weekly-progress", safeMetrics.weekSteps, "steps this week");

  // Handle edit button state
  const editBtn = document.getElementById("edit-steps-button");
  const canEdit = todaysMetrics !== null;
  if (editBtn) {
    editBtn.disabled = !canEdit;
    if (!canEdit) {
      console.log("Disabling edit button because initial step load failed.");
    }
  }

  // Load and display real leaderboard data
  const leaderboardData = await loadLeaderboardData(backendId);
  const leaderboardBody = document.getElementById("leaderboard-body");
  if (leaderboardBody) {
    leaderboardBody.innerHTML = ""; // clear old leaderboard
    if (leaderboardData && leaderboardData.leaderboard && leaderboardData.leaderboard.length > 0) {
      leaderboardData.leaderboard.forEach((entry) => {
        const row = document.createElement("tr");
        // Highlight current user
        if (entry.userId === backendId) {
          row.style.fontWeight = "bold";
          row.style.backgroundColor = "#fff9c4";
        }
        row.innerHTML = `
          <td>${entry.rank}</td>
          <td>${entry.username}</td>
          <td>${entry.totalSteps.toLocaleString()}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    } else {
      leaderboardBody.innerHTML = '<tr><td colspan="3">Leaderboard data unavailable.</td></tr>';
    }
  }

  // Update other metrics if static data is available
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
  updateMetric("display-steps-container", "Error", "");
  updateMetric("display-calories-container", "Error", "");
  updateMetric("distance-covered", "Error", "");
  updateMetric("active-minutes", "Error", "");

  const editBtn = document.getElementById("edit-steps-button");
  if (editBtn) editBtn.disabled = true;

  const leaderboardBody = document.getElementById("leaderboard-body");
  if (leaderboardBody) {
    leaderboardBody.innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
  }
  updateMetric("weekly-progress", "Error", "");
  updateElementText("best-streak", "Error");
  updateElementText("record-steps", "Error");

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
  let currentTodaysCalories = 0;
  let currentDistanceCovered = 0;
  let currentActiveMinutes = 0;
  let weekProgress = 0;

  const weekArr = getWeekArray()
  let weekSteps = weekArr.map((day) => [day, 0]);

  const displayStepsContainer = document.getElementById("display-steps-container");
  const editContainer = document.getElementById("edit-steps-container");
  const editStepsButton = document.getElementById("edit-steps-button");
  const saveStepsButton = document.getElementById("save-steps-button");
  const cancelStepsButton = document.getElementById("cancel-steps-button");
  const editStepsInput = document.getElementById("edit-steps-input");
  const editStepsMessage = document.getElementById("edit-steps-message");

  const displayCaloriesContainer = document.getElementById("display-calories-container");
  const editCaloriesContainer = document.getElementById("edit-calories-container");
  const editCaloriesButton = document.getElementById("edit-calories-button");
  const saveCaloriesButton = document.getElementById("save-calories-button");
  const cancelCaloriesButton = document.getElementById("cancel-calories-button");
  const editCaloriesInput = document.getElementById("edit-calories-input");
  const editCaloriesMessage = document.getElementById("edit-calories-message");

  function showStepsEditMode() {
    editStepsInput.value = currentTodaysSteps;
    displayStepsContainer.style.display = "none";
    editStepsButton.style.display = "none";
    editContainer.style.display = "block";
    editStepsMessage.textContent = "";
    saveStepsButton.disabled = false;
    cancelStepsButton.disabled = false;
    editStepsInput.focus();
  }

  function showCaloriesEditMode() {
    editCaloriesInput.value = currentTodaysCalories;
    displayCaloriesContainer.style.display = "none";
    editCaloriesButton.style.display = "none";
    editCaloriesContainer.style.display = "block";
    editCaloriesMessage.textContent = "";
    saveCaloriesButton.disabled = false;
    cancelCaloriesButton.disabled = false;
    editCaloriesInput.focus();
  }

  function showStepsDisplayMode(steps) {
    updateMetric("display-steps-container", steps, "steps");
    updateMetric("daily-step-trend", steps, "steps today");

    editContainer.style.display = "none";
    displayStepsContainer.style.display = "block";
    editStepsButton.style.display = "block";
    editStepsMessage.textContent = "";
  }

  function showCaloriesDisplayMode(calories) {
    updateMetric("display-calories-container", calories, "kcal");

    editCaloriesContainer.style.display = "none";
    displayCaloriesContainer.style.display = "block";
    editCaloriesButton.style.display = "block";
    editCaloriesMessage.textContent = "";
  }

  if (editStepsButton) {
    editStepsButton.addEventListener("click", () => {
      console.log("Edit button clicked. Current steps:", currentTodaysSteps);
      showStepsEditMode();
    });
  }

  if (editCaloriesButton) {
    editCaloriesButton.addEventListener("click", () => {
      console.log("Edit button clicked. Current calories:", currentTodaysCalories);
      showCaloriesEditMode();
    });
  }

  if (cancelStepsButton) {
    cancelStepsButton.addEventListener("click", () => {
      console.log("Cancel button clicked.");
      showStepsDisplayMode(currentTodaysSteps);
    });
  }

  if (cancelCaloriesButton) {
    cancelCaloriesButton.addEventListener("click", () => {
      console.log("Cancel button clicked.");
      showCaloriesDisplayMode(currentTodaysCalories);
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
      const leaderboardData = await loadLeaderboardData(backendId);

      if (result.success) {
        currentTodaysSteps = result.savedSteps;
        currentActiveMinutes = Math.ceil(result.savedSteps / 100);
        currentDistanceCovered = currentTodaysSteps * 2.4;
        weekSteps = weekSteps.map(day => day[0] === getTodayDateString() ? [day[0], result.savedSteps] : day);
        weekProgress = weekSteps.reduce((acc, e) => acc + e[1], 0);
        editStepsMessage.textContent = "Saved!";
        setTimeout(() => {
          showStepsDisplayMode(currentTodaysSteps);
          updateMetric("weekly-progress", weekProgress, "steps this week");
          updateMetric("distance-covered", currentDistanceCovered, "feet");
          updateMetric("active-minutes", currentActiveMinutes, "mins");
          displayLeaderboardData(leaderboardData, backendId);
          drawChart();
        }, 1000);
        await updateRecordAndStreak(backendId);
      } else {
        editStepsMessage.textContent = `Error: ${result.message}`;
        saveStepsButton.disabled = false;
        cancelStepsButton.disabled = false;
      }
    });
  }

  if (saveCaloriesButton) {
    saveCaloriesButton.addEventListener("click", async () => {
      const newCaloriesValue = editCaloriesInput.value.trim();
      const newCalories = parseInt(newCaloriesValue, 10);

      console.log("Save button clicked. Input value:", newCaloriesValue);

      if (isNaN(newCalories) || newCalories < 0 || newCaloriesValue === "") {
        editCaloriesMessage.textContent =
          "Please enter a valid number (0 or greater).";
        return;
      }

      saveCaloriesButton.disabled = true;
      cancelCaloriesButton.disabled = true;
      editCaloriesMessage.textContent = "Saving...";

      const result = await saveTodaysCalories(backendId, newCalories);

      console.log(result);

      if (result.success) {
        currentTodaysCalories = result.savedCalories;
        editCaloriesMessage.textContent = "Saved!";
        setTimeout(() => {
          showCaloriesDisplayMode(currentTodaysCalories);
        }, 1000);
      } else {
        editCaloriesMessage.textContent = `Error: ${result.message}`;
        saveCaloriesButton.disabled = false;
        cancelCaloriesButton.disabled = false;
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

        document.body.dataset.userId = backendId;

        const [todaysMetrics, staticData] = await Promise.all([
          loadTodaysStepData(backendId),
          loadStaticDashboardData(),
        ]);

        const calorieMetric = await loadTodaysCalorieData(backendId);
        todaysMetrics.calories = calorieMetric.calories;

        const weekStepData = await getWeekStepData(backendId);

        if (weekStepData) {
          weekSteps = weekStepData;
          weekProgress = weekStepData.reduce((acc, e) => acc + e[1], 0);
          todaysMetrics.weekSteps = weekProgress
        }

        if (todaysMetrics) {
          currentTodaysSteps = todaysMetrics.steps;
          currentTodaysCalories = todaysMetrics.calories;
        } else {
          currentTodaysSteps = 0;
          currentTodaysCalories = 0;
          if (editStepsButton) editStepsButton.disabled = true;
          if (editCaloriesButton) editCaloriesButton.disabled = true;
          console.warn("Initial load for today's metrics failed.");
        }
        await displayDashboardData(todaysMetrics, null, backendId);
        await updateRecordAndStreak(backendId);
        
        // ─── Live-fetch record & best-streak ──────────────────────────
      
        // ───────────────────────────────────────────────────────────────

      } else {
        // user exists locally but is missing backendId
        console.error(
          "Backend ID not found for logged-in user:",
          currentUserEmail
        );
        delete document.body.dataset.userId;
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
      delete document.body.dataset.userId;
      if (userEmailDisplay) userEmailDisplay.textContent = "Error";
      localStorage.removeItem("currentUser");
      displayErrorState("Failed to load user data. Please log in again.");
      setTimeout(() => {
        window.location.href = "loginPage.html";
      }, 2000);
    }
  } catch (err) {
    console.error("Failed to get user data from DB or load dashboard:", err);
    delete document.body.dataset.userId;
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

  // Load the Visualization API and the piechart package.
  google.charts.load('current', { 'packages': ['corechart'] });

  // Set a callback to run when the Google Visualization API is loaded.
  google.charts.setOnLoadCallback(drawChart);

  // Callback that creates and populates a data table, 
  // instantiates the pie chart, passes in the data and
  // draws it.
  function drawChart() {
    // Create the data table.
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Date');
    data.addColumn('number', 'Step Count');
    data.addRows(weekSteps);

    // Set chart options
    let options = {
      colors: ['#b30000'],
      vAxis: {
        title: 'Step Count',
        titleTextStyle: {}
      },
      legend: 'none'
    };

    // Instantiate and draw our chart, passing in some options.
    let chart = new google.visualization.ColumnChart(document.getElementById('myChart'));
    chart.draw(data, options);
    window.addEventListener('resize', drawChart);
  }

});

