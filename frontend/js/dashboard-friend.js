document.addEventListener("DOMContentLoaded", function () {
  const friendTabBar = document.getElementById("friend-side-bar");
  const friendTabBarButton = document.getElementById("friend-side-bar-button");
  const friendTabBarClose = document.getElementById("friend-side-bar-close");

  function openFriendSideBar() {
    if (friendTabBar) {
      friendTabBar.classList.add("open");
      console.log("works");
    }
  }
  function closeFriendSideBar() {
    if (friendTabBar) {
      friendTabBar.classList.remove("open");
      console.log("works");
    }
  }

  if (friendTabBarButton) {
    friendTabBarButton.addEventListener("click", openFriendSideBar);
  }
  if (friendTabBarClose) {
    friendTabBarClose.addEventListener("click", closeFriendSideBar);
  }

  const emailInput = document.getElementById("friend-search-bar");
  const friendList = document.getElementById("friend-list");

  function addFriend() {
    let newFriend = emailInput.value.trim();

    // Check if the input is not empty
    if (newFriend) {
      // Create a new list item element
      var listItem = document.createElement("li");
      listItem.textContent = newFriend;

      // Append the new list item to the dynamic list
      friendList.appendChild(listItem);

      // Clear the input field for the next item
      emailInput.value = "";
    } else {
      alert("Please enter an item.");
    }
  }

  if (emailInput) {
    emailInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addFriend();
      }
    });
  } else {
    console.error("Friend search bar not found");
  }
});
