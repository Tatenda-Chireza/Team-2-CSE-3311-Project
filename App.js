let currentUser = null;

// ✅ NEW: redirect to menu after closing modal if user is logged in
function closeModal() {
    document.getElementById('login-form').style.display = 'none';
    document.body.style.overflow = 'auto';
    clearError();

    // ✅ NEW: redirect to menu page
    if (currentUser) {
        window.location.href = 'menu.html';
    }
}

// Initialize user state on page load
window.onload = function() {
    checkUserStatus();
    updateHeaderButton(); // ✅ NEW: update header button if already logged in
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

// ✅ NEW: dynamically update the signup button
function updateHeaderButton() {
    const btn = document.getElementById('signupBtn');
    if (currentUser) {
        btn.textContent = `Hi, ${currentUser.firstName || currentUser.email.split('@')[0]}`;
        btn.onclick = null; // remove modal popup
    } else {
        btn.textContent = 'Sign up';
        btn.onclick = openModal;
    }
}

function handleLogin(event) {
    event.preventDefault();
    clearError();
      
    const formData = new FormData(event.target);
    const email = formData.get('loginEmail');
    const password = formData.get('loginPassword');

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 8) {
        showError('Password length invalid');
        return;
    }

    setTimeout(() => {
        currentUser = { email };
        updateHeaderButton(); // ✅ NEW
        showSuccessMessage('Login Successful!', `Welcome back, ${email}`);
        
        setTimeout(() => {
            closeModal(); // ✅ NEW: redirect happens here
        }, 2000);

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

    setTimeout(() => {
        currentUser = {
            firstName: firstName,
            lastName: lastName,
            email: email
        };
        updateHeaderButton(); // ✅ NEW

        showSuccessMessage(
            'Registration Successful!',
            'Your account has been created and you are now logged in.'
        );

        setTimeout(() => {
            closeModal(); // ✅ NEW: redirect happens here
        }, 2000);

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
