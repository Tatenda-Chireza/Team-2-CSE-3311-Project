let currentUser = null;
    
// Initialize user state on page load
window.onload = function() {
    checkUserStatus();
 };

function getUserData() {
    return currentUser;
}

function openModal() {
    document.getElementById('login-form').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    clearError();
}

function closeModal() {
    document.getElementById('login-form').style.display = 'none';
    document.body.style.overflow = 'auto';
    clearError();
}

function showLogin() {
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('register').classList.add('hidden');
      
    document.getElementById('login-btn').classList.add('active');
    document.getElementById('register-btn').classList.remove('active');
      
    document.getElementById('buttonSlider').classList.remove('register');
    clearError();
}
    
function showRegister() {
    document.getElementById('register').classList.remove('hidden');
    document.getElementById('login').classList.add('hidden');
      
    document.getElementById('register-btn').classList.add('active');
    document.getElementById('login-btn').classList.remove('active');
      
    document.getElementById('buttonSlider').classList.add('register');
    clearError();
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
        
    closeModal();
    
    showSuccessMessage('Registration Successful!', 
          `Your account has been created and you are now logged in.`
 ); }, 500);
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
