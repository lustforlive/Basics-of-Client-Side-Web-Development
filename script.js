const registerBtn = document.getElementById('registerBtn');
const modal = document.getElementById('registerModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const registerForm = document.getElementById('registerForm');
const showPasswordBtn = document.getElementById('showPasswordBtn');
const passwordInput = document.getElementById('password');

registerBtn.addEventListener('click', (event) => {
    event.preventDefault();
    modal.showModal();
});

function closeModal() {
    modal.close();
    registerForm.reset();
    clearAllErrors();
}

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

function clearAllErrors() {
    const inputs = ['name', 'email', 'password'];
    inputs.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        const errorDiv = document.getElementById(`${fieldId}-error`);
        if (input) {
            input.removeAttribute('aria-invalid');
        }
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.setAttribute('hidden', '');
        }
    });
}

function validateField(field) {
    const fieldId = field.id;
    const errorDiv = document.getElementById(`${fieldId}-error`);
    let errorMessage = '';
    
    if (field.validity.valueMissing) {
        errorMessage = 'Это поле обязательно для заполнения';
    } else if (field.validity.typeMismatch && field.type === 'email') {
        errorMessage = 'Введите корректный email адрес';
    } else if (field.validity.tooShort) {
        errorMessage = `Пароль должен содержать минимум ${field.minLength} символов (сейчас ${field.value.length})`;
    }
    
    if (errorMessage) {
        field.setAttribute('aria-invalid', 'true');
        errorDiv.textContent = errorMessage;
        errorDiv.removeAttribute('hidden');
        return false;
    } else {
        field.removeAttribute('aria-invalid');
        errorDiv.textContent = '';
        errorDiv.setAttribute('hidden', '');
        return true;
    }
}

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');

[nameInput, emailInput, passwordInput].forEach(input => {
    input.addEventListener('blur', () => {
        validateField(input);
    });
});

registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const isNameValid = validateField(nameInput);
    const isEmailValid = validateField(emailInput);
    const isPasswordValid = validateField(passwordInput);
    
    if (isNameValid && isEmailValid && isPasswordValid) {
        const formData = new FormData(registerForm);
        const formDataObj = {};
        
        for (let [key, value] of formData.entries()) {
            formDataObj[key] = value;
        }
        
        console.log('Данные формы:', formDataObj);
        alert('Регистрация успешна! Данные отправлены в консоль.');
        closeModal();
    } else {
        const firstInvalidField = [nameInput, emailInput, passwordInput].find(
            input => input.getAttribute('aria-invalid') === 'true'
        );
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
    }
});

let isPasswordVisible = false;

showPasswordBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    isPasswordVisible = true;
    passwordInput.type = 'text';
});

showPasswordBtn.addEventListener('pointerup', (event) => {
    event.preventDefault();
    isPasswordVisible = false;
    passwordInput.type = 'password';
});

showPasswordBtn.addEventListener('pointerleave', () => {
    if (isPasswordVisible) {
        passwordInput.type = 'password';
        isPasswordVisible = false;
    }
});

modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeModal();
});