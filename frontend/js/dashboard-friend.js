import { BACKEND_URL } from "./config.js";

// ─── Generic API fetch helper (hoisted to module scope) ─────────────────────────
async function fetchApi(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      let errorData = { message: `HTTP error! Status: ${response.status}` };
      try {
        errorData = await response.json();
      } catch (e) {}
      console.error("API Error:", errorData);
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch API Error:", error);
    throw error;
  }
}

// ─── Fetch & display steps for **any** user/span pair ───────────────────────────
async function fetchUserSteps(userId, stepsSpan) {
  const today = new Date().toISOString().split("T")[0];
  const stepsUrl = `${BACKEND_URL}/api/profiles/${userId}/steps?start=${today}&end=${today}`;
  try {
    const data = await fetchApi(stepsUrl);
    const todaySteps = Array.isArray(data) && data.length > 0 ? data[0].steps : 0;
    stepsSpan.textContent = `${todaySteps} steps today`;
  } catch (err) {
    stepsSpan.textContent = "Steps N/A";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const friendTabBar = document.getElementById("friend-side-bar");
  const friendTabBarButton = document.getElementById("friend-side-bar-button");
  const friendTabBarClose = document.getElementById("friend-side-bar-close");
  const searchInput = document.getElementById("friend-search-bar");
  const searchResultsList = document.getElementById("friend-search-results");
  const friendList = document.getElementById("friend-list");
  const searchPlaceholder = document.getElementById("search-placeholder");
  const friendListLoading = document.getElementById("friend-list-loading");

  let currentUserId = null;
  let searchTimeout = null;
  let currentFriendsIds = new Set();

  // debounce helper
  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // ─── SEARCH ───────────────────────────────────────────────────────────────────
  async function searchUsers(query) {
    if (!currentUserId) {
      searchResultsList.innerHTML = `<li style="color: red;">Error: User not identified.</li>`;
      return;
    }
    if (!query || query.length < 3) {
      searchResultsList.innerHTML = "";
      if (searchPlaceholder) searchPlaceholder.style.display = "block";
      return;
    }
    searchResultsList.innerHTML = `<li>Searching…</li>`;
    if (searchPlaceholder) searchPlaceholder.style.display = "none";

    try {
      const searchUrl = `${BACKEND_URL}/api/profiles/search?query=${encodeURIComponent(query)}`;
      const users = await fetchApi(searchUrl);
      displaySearchResults(users);
    } catch (error) {
      searchResultsList.innerHTML = `<li style="color: red;">Error: ${error.message}</li>`;
    }
  }

  function displaySearchResults(users) {
    searchResultsList.innerHTML = "";
    if (!users || users.length === 0) {
      return void (searchResultsList.innerHTML = `<li>No users found.</li>`);
    }

    const filtered = users.filter(u => u.id !== currentUserId);
    if (filtered.length === 0) {
      return void (searchResultsList.innerHTML = `<li>No other users found.</li>`);
    }

    filtered.forEach(user => {
      const li = document.createElement("li");
      const isFriend = currentFriendsIds.has(user.id);

      li.innerHTML = `
        <div class="user-info">
          <span>${user.first_name || ""} ${user.last_name || ""}</span>
          <span class="user-email">${user.email}</span>
          <span class="user-steps">Loading…</span>
        </div>
        <button
          class="add-friend-button"
          data-friend-id="${user.id}"
          ${isFriend ? "disabled" : ""}
        >${isFriend ? "Friend" : "Add"}</button>
      `;

      if (!isFriend) {
        li.querySelector(".add-friend-button")
          .addEventListener("click", handleAddFriendClick);
      }

      searchResultsList.appendChild(li);

      // ← this now finds fetchApi correctly
      const stepsSpan = li.querySelector(".user-steps");
      fetchUserSteps(user.id, stepsSpan);
    });
  }

  const debouncedSearch = debounce(searchUsers, 500);
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      if (searchPlaceholder) searchPlaceholder.style.display = "none";
      debouncedSearch(e.target.value);
    });
  }

  // ─── ADD FRIEND ───────────────────────────────────────────────────────────────
  async function handleAddFriendClick(evt) {
    const btn = evt.target;
    const friendId = btn.dataset.friendId;
    if (!currentUserId || !friendId) {
      return alert("Error: Missing user or friend ID.");
    }

    btn.disabled = true;
    btn.textContent = "Adding…";

    try {
      await fetchApi(`${BACKEND_URL}/api/friendships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, friendId })
      });
      currentFriendsIds.add(friendId);
      loadFriends();
    } catch (err) {
      console.error(err);
      alert(`Could not add friend: ${err.message}`);
      btn.disabled = false;
      btn.textContent = "Add";
    }
  }

  // ─── FRIEND LIST ─────────────────────────────────────────────────────────────
  async function loadFriends() {
    if (!currentUserId) {
      friendList.innerHTML = `<li style="color: red;">Error: User not identified.</li>`;
      return;
    }
    friendList.innerHTML = `<li>Loading friends…</li>`;
    if (friendListLoading) friendListLoading.style.display = "block";

    try {
      const fr = await fetchApi(
        `${BACKEND_URL}/api/friendships/user/${currentUserId}`
      );
      displayFriends(fr);
    } catch (err) {
      friendList.innerHTML = `<li style="color: red;">Error: ${err.message}</li>`;
    }
  }

  function displayFriends(friendships) {
    friendList.innerHTML = "";
    currentFriendsIds.clear();

    if (!friendships || friendships.length === 0) {
      return void (friendList.innerHTML = `<li>You have no friends yet.</li>`);
    }

    friendships.forEach(f => {
      let profile =
        f.profile ||
        (f.userProfile && f.userProfile.id !== currentUserId && f.userProfile) ||
        (f.friendProfile && f.friendProfile.id !== currentUserId && f.friendProfile) ||
        f;

      if (profile && profile.id) {
        currentFriendsIds.add(profile.id);

        const li = document.createElement("li");
        li.classList.add("friend-item");
        li.innerHTML = `
          <div class="user-info">
            <span>${profile.first_name || ""} ${profile.last_name || ""}</span>
            <span class="user-email">${profile.email}</span>
          </div>
          <span class="friend-steps">Loading…</span>
        `;
        friendList.appendChild(li);

        const stepsSpan = li.querySelector(".friend-steps");
        fetchUserSteps(profile.id, stepsSpan);
      }
    });
  }

  // ─── OPEN / CLOSE SIDEBAR ────────────────────────────────────────────────────
  function openFriendSideBar() {
    currentUserId = document.body.dataset.userId;
    if (!currentUserId) {
      return alert("Error: Could not identify user. Please reload.");
    }
    friendTabBar.classList.add("open");
    loadFriends();
    searchInput.value = "";
    searchResultsList.innerHTML = "";
    if (searchPlaceholder) searchPlaceholder.style.display = "block";
  }

  function closeFriendSideBar() {
    friendTabBar.classList.remove("open");
    searchInput.value = "";
    searchResultsList.innerHTML = "";
    if (searchPlaceholder) searchPlaceholder.style.display = "block";
  }

  friendTabBarButton?.addEventListener("click", openFriendSideBar);
  friendTabBarClose?.addEventListener("click", closeFriendSideBar);

  if (searchPlaceholder) searchPlaceholder.style.display = "block";
  if (friendListLoading) friendListLoading.style.display = "none";
});

