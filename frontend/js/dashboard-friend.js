import { BACKEND_URL } from "./config.js";

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

  // needed to limit API calls
  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

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

  async function searchUsers(query) {
    if (!currentUserId) {
      console.warn("Current User ID not set, cannot search.");
      searchResultsList.innerHTML = `<li id="search-error" style="color: red;">Error: User not identified.</li>`;
      return;
    }
    if (!query || query.length < 3) {
      // min query length
      searchResultsList.innerHTML = "";
      if (searchPlaceholder) searchPlaceholder.style.display = "block";
      return;
    }

    console.log(`Searching for users with query: ${query}`);
    searchResultsList.innerHTML = `<li id="search-loading">Searching...</li>`;
    if (searchPlaceholder) searchPlaceholder.style.display = "none";

    try {
      const searchUrl = `${BACKEND_URL}/api/profiles/search?query=${encodeURIComponent(
        query
      )}`;
      const users = await fetchApi(searchUrl);
      displaySearchResults(users);
    } catch (error) {
      searchResultsList.innerHTML = `<li id="search-error" style="color: red;">Error searching: ${error.message}</li>`;
    }
  }

  function displaySearchResults(users) {
    searchResultsList.innerHTML = ""; // clear previous results/loading
  
    if (!users || users.length === 0) {
      searchResultsList.innerHTML = `<li>No users found.</li>`;
      return;
    }
  
    const filteredUsers = users.filter((user) => user.id !== currentUserId);
  
    if (filteredUsers.length === 0) {
      searchResultsList.innerHTML = `<li>No other users found.</li>`;
      return;
    }
  
    filteredUsers.forEach((user) => {
      const li = document.createElement("li");
      const isAlreadyFriend = currentFriendsIds.has(user.id);
  
      li.innerHTML = `
        <div class="user-info">
          <span>${user.first_name || ""} ${user.last_name || ""}</span>
          <span class="user-email">${user.email}</span>
          <span class="user-steps">Loading…</span>
        </div>
        <button class="add-friend-button" data-friend-id="${user.id}" ${isAlreadyFriend ? "disabled" : ""}>
          ${isAlreadyFriend ? "Friend" : "Add"}
        </button>
      `;
  
      const addButton = li.querySelector(".add-friend-button");
      if (addButton && !isAlreadyFriend) {
        addButton.addEventListener("click", handleAddFriendClick);
      }
  
      searchResultsList.appendChild(li);
  
      // ← NEW: fetch and display this user’s steps
      const stepsSpan = li.querySelector(".user-steps");
      fetchUserSteps(user.id, stepsSpan);
    });
  }
  

  const debouncedSearch = debounce(searchUsers, 500);

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      if (searchPlaceholder) searchPlaceholder.style.display = "none";
      debouncedSearch(event.target.value);
    });
  }

  async function handleAddFriendClick(event) {
    const button = event.target;
    const friendId = button.dataset.friendId;
  
    if (!currentUserId || !friendId) {
      alert("Error: Cannot add friend. User or friend ID missing.");
      return;
    }
  
    console.log(
      `Attempting to add friend: ${friendId} for user: ${currentUserId}`
    );
    button.disabled = true;
    button.textContent = "Adding...";
  
    const addFriendUrl = `${BACKEND_URL}/api/friendships`;
    const payload = {
      userId: currentUserId,
      friendId: friendId,
    };
  
    try {
      await fetchApi(addFriendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      console.log("Friend added successfully via API.");
      button.textContent = "Friend";
      currentFriendsIds.add(friendId);
      loadFriends();
    } catch (error) {
      console.error("Error adding friend:", error);
      alert(`Could not add friend: ${error.message}`);
      if (error.message.toLowerCase().includes("already exists")) {
        // If it's already there, just reload the list
        loadFriends();
      } else {
        button.disabled = false;
      }
      button.textContent = "Add";
    }
  }
  

  async function loadFriends() {
    if (!currentUserId) {
      console.warn("Current User ID not set, cannot load friends.");
      friendList.innerHTML = `<li id="friend-list-error" style="color: red;">Error: User not identified.</li>`;
      if (friendListLoading) friendListLoading.style.display = "none";
      return;
    }

    console.log(`Loading friends for user: ${currentUserId}`);
    friendList.innerHTML = `<li id="friend-list-loading">Loading friends...</li>`;
    if (friendListLoading) friendListLoading.style.display = "block";

    try {
      const listFriendsUrl = `${BACKEND_URL}/api/friendships/user/${currentUserId}`;
      const friendships = await fetchApi(listFriendsUrl);
      displayFriends(friendships);
    } catch (error) {
      friendList.innerHTML = `<li id="friend-list-error" style="color: red;">Error loading friends: ${error.message}</li>`;
    }
  }

  function displayFriends(friendships) {
    friendList.innerHTML = "";
    currentFriendsIds.clear();
  
    if (!friendships || friendships.length === 0) {
      friendList.innerHTML = `<li>You haven't added any friends yet.</li>`;
      return;
    }
  
    friendships.forEach((friendship) => {
      let friendProfile = null;
  
      if (friendship.profile) {
        friendProfile = friendship.profile;
      } else if (
        friendship.userProfile &&
        friendship.userProfile.id !== currentUserId
      ) {
        friendProfile = friendship.userProfile;
      } else if (
        friendship.friendProfile &&
        friendship.friendProfile.id !== currentUserId
      ) {
        friendProfile = friendship.friendProfile;
      } else if (friendship.id && friendship.email) {
        friendProfile = friendship;
      }
  
      if (friendProfile && friendProfile.id) {
        currentFriendsIds.add(friendProfile.id);
  
        const li = document.createElement("li");
        li.classList.add("friend-item");
        li.innerHTML = `
          <div class="user-info">
            <span>${friendProfile.first_name || ""} ${friendProfile.last_name || ""}</span>
            <span class="user-email">${friendProfile.email}</span>
          </div>
          <span class="friend-steps">Loading…</span>
        `;
        friendList.appendChild(li);
  
        // fetch & display that friend's steps
        const stepsSpan = li.querySelector(".friend-steps");
        fetchUserSteps(friendProfile.id, stepsSpan);
      }
    });
  }
  
  

  function openFriendSideBar() {
    if (friendTabBar) {
      currentUserId = document.body.dataset.userId;
      if (currentUserId) {
        friendTabBar.classList.add("open");
        console.log("Friend sidebar opened. User ID:", currentUserId);
        loadFriends();
        searchInput.value = "";
        searchResultsList.innerHTML = "";
        if (searchPlaceholder) searchPlaceholder.style.display = "block";
      } else {
        console.error(
          "Cannot open friend sidebar: User ID not found in body dataset."
        );
        alert("Error: Could not identify user. Please reload.");
      }
    }
  }

  function closeFriendSideBar() {
    if (friendTabBar) {
      friendTabBar.classList.remove("open");
      console.log("Friend sidebar closed.");
      searchInput.value = "";
      searchResultsList.innerHTML = "";
      if (searchPlaceholder) searchPlaceholder.style.display = "block";
    }
  }

  if (friendTabBarButton) {
    friendTabBarButton.addEventListener("click", openFriendSideBar);
  }
  if (friendTabBarClose) {
    friendTabBarClose.addEventListener("click", closeFriendSideBar);
  }

  if (searchPlaceholder) searchPlaceholder.style.display = "block";
  if (friendListLoading) friendListLoading.style.display = "none";
});
