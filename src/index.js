function login() {
    const usernameOrEmail = document.getElementById("usernameEmail").value;
    const password = document.getElementById("password").value;
    const credentials = btoa(usernameOrEmail + ":" + password);

    fetch("https://01.kood.tech/api/auth/signin", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + credentials
      }
    })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Invalid credentials");
          }
        })
        .then(data => {
          const jwt = data; 
          localStorage.setItem("jwt", jwt);
          window.location.href = "main.html";
        })
    .catch(error => {
      document.getElementById("error-message").innerText = error.message;
      document.getElementById("error-message").style.display = "block";
    });
  }
  