document.addEventListener("DOMContentLoaded", () => {
  if (localStorage) {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const jsonUserData = JSON.parse(atob(userData));
      if (jsonUserData.isGT18 === true) {
        ageCheckbox.checked = true;
      } else {
        alert("You must be 18 or older to access this website.");

        window.location.href = "/";
      }
      if (jsonUserData.gender === "female") {
        document.querySelector(
          'input[name="gender"][value="female"]'
        ).checked = true;
      } else {
        document.querySelector(
          'input[name="gender"][value="male"]'
        ).checked = true;
      }
    } else {
      alert("You must be 18 or older to access this website.");

      window.location.href = "/";
    }
  } else {
    alert("You must be 18 or older to access this website.");

    window.location.href = "/";
  }
});
