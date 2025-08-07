const jsonFilePath = 'user.json';

const loginForm = document.getElementById('form1');
const resultDiv = document.getElementById('ResultDiv');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const usernameInput = document.getElementById('username').value.trim();
  const passwordInput = document.getElementById('password').value;

  if (!usernameInput || !passwordInput) {
    resultDiv.innerHTML = `<p style="color: orange;">Please enter both username and password.</p>`;
    return;
  }

  fetch(jsonFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      const userFound = data.users.find(user =>
        user.username === usernameInput && user.password === passwordInput
      );

      if (userFound) {
        resultDiv.innerHTML = `<p style="color: green;">Login successful! Welcome, ${userFound.username}.</p>`;
        setTimeout(() => {
          window.location.href = 'dashboard.html'; // Replace with your target page
        }, 2000);
      } else {
        resultDiv.innerHTML = `<p style="color: red;">Invalid username or password.</p>`;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      resultDiv.innerHTML = `<p style="color: red;">An error occurred while fetching user data.</p>`;
    });
});
