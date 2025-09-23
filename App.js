let currentUser = null;

function closeModal() {
  document.getElementById('login-form').style.display = 'none';
  document.body.style.overflow = 'auto';
  clearError();
}
    
// Initialize user state on page load
window.onload = function() {
    checkUserStatus();
 };

function checkUserStatus() {
    console.log('Checking user status.')
}
function getUserData() {
    return currentUser;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    clearError();
      
    const formData = new FormData(event.target);
    const email = formData.get('loginEmail');
    const password = formData.get('loginPassword');

    // Validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 8) {
        showError('Password length invalid');
        return;
    }

    // Simulate succesful login
    setTimeout(() => {
        currentUser = { email };
        showSuccessMessage('Login Successful!', `Welcome back, ${email}`);
        // Delay closing of Login/Sign up page
        setTimeout(() => {
        closeModal();
        }, 2000);
        // Delay closing of success message
        setTimeout(() => {
            closeSuccessModal();
        }, 4000);
        }, 500);
    
}

function handleRegister(event) {
    event.preventDefault();
    clearError();
      
    const formData = new FormData(event.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showError('Please fill in all fields');
    return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }

    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }

    // Simulate registration process
    setTimeout(() => {
        currentUser = {
          firstName: firstName,
          lastName: lastName,
          email: email
    };

    showSuccessMessage(
      'Registration Successful!',
      'Your account has been created and you are now logged in.'
    );

    // Delay closing of Login/Sign up page
    setTimeout(() => {
    closeModal();
    }, 2000);

    // Delay success message
    setTimeout(() => {
            closeSuccessModal();
    }, 4000);
    
    }, 500);
 
 }

function showSuccessMessage(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = 'auto';
 }

function showMessage(message, type) {
    alert(message);
}
