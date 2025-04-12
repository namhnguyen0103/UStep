document.addEventListener("DOMContentLoaded", function () {

    const friendTabBar = document.getElementById("friend-side-bar");
    const friendTabBarButton = document.getElementById("friend-side-bar-button");
    const friendTabBarClose = document.getElementById("friend-side-bar-close");
    function openFriendSideBar() {
      friendTabBar.style.display = "block";
      console.log('works');
    }
    function closeFriendSideBar() {
        friendTabBar.style.display = "none";
        console.log('works');
    }
    friendTabBarButton.addEventListener("click", openFriendSideBar);
    friendTabBarClose.addEventListener("click", closeFriendSideBar);

    const emailInput = document.getElementById("friend-search-bar");
    const friendList = document.getElementById("friend-list");
    
    function addFriend() {
        let newFriend = emailInput.value.trim();

        // Check if the input is not empty
        if (newFriend) {
            // Create a new list item element
            var listItem = document.createElement('li');
            listItem.textContent = newFriend;

            // Append the new list item to the dynamic list
            friendList.appendChild(listItem);

            // Clear the input field for the next item
            emailInput.value = '';
        } else {
            alert('Please enter an item.');
        }
    }

    emailInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            addFriend();
        }
    })
});