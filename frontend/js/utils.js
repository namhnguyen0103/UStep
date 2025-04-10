export function showMessage(messageElement, message, type) {
  messageElement.textContent = message;
  messageElement.className = `form-message ${type}`;
  messageElement.style.display = "block";
}
