// Определяем элементы окна ошибки
const errorModal = document.getElementById('error_modal');
const errorMessage = document.getElementById('error_message');
const errorModalCloseButton = document.getElementById('error_modal_close_button');
const mainContainer = document.getElementsByClassName('mainContainer')[0];
const header = document.getElementById('header');


// Функция для показа ошибки
function showError(message) 
{
    errorMessage.textContent = message;
    errorModal.style.display = 'block';
    mainContainer.classList.add('blur');
    header.classList.add('blur');
}


// Закрытие при клике на крестик
errorModalCloseButton.onclick = () =>
{
    errorModal.style.display = 'none';
    mainContainer.classList.remove('blur');
    header.classList.remove('blur');
}

// Закрытие при клике вне окна
window.onclick = (e) =>
{
    if (e.target == errorModal)
    {
        errorModal.style.display = 'none';
        mainContainer.classList.remove('blur');
        header.classList.remove('blur');
    }
}