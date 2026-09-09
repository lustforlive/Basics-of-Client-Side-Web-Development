const API_CONFIG = {
  BASE_URL: 'http://95.163.242.125',
  RETRY_LIMIT: 3,
  RETRY_DELAY_MS: 1500
};

const toastContainer = document.getElementById('toastContainer');

/**
 * Создает и показывает всплывающее уведомление
 * @param {string} message
 * @param {'success' | 'error'} type
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const textSpan = document.createElement('span');
  textSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Закрыть уведомление');
  closeBtn.innerHTML = '&times;';

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  const removeToast = () => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  closeBtn.addEventListener('click', removeToast);
  setTimeout(removeToast, 5000);
}

const themeToggleBtn = document.getElementById('themeToggle');

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('app-theme', newTheme);
});

const galleryContainer = document.getElementById('galleryContainer');
const galleryLoader = document.getElementById('galleryLoader');
const reloadGalleryBtn = document.getElementById('reloadGalleryBtn');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGalleryWithRetry(retriesLeft = API_CONFIG.RETRY_LIMIT) {
  const attemptNum = API_CONFIG.RETRY_LIMIT - retriesLeft + 1;

  galleryLoader.classList.add('active');
  galleryContainer.innerHTML = '';
  reloadGalleryBtn.disabled = true;

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/images`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Сервер ответил со статусом ${response.status}`);
    }

    const rawText = await response.text();

    if (!rawText || rawText.trim().startsWith('<')) {
      throw new Error('Сервер вернул HTML вместо JSON');
    }

    let data = JSON.parse(rawText);
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (Array.isArray(data) && data.length > 0 && data[0].status === 'error') {
      throw new Error(data[0].message || 'Сбой на стороне сервера');
    }

    galleryLoader.classList.remove('active');
    reloadGalleryBtn.disabled = false;
    renderGallery(data);
  } catch (error) {
    console.warn(`[Галерея] Попытка №${attemptNum} отклонена:`, error.message);

    if (retriesLeft > 1) {
      await sleep(API_CONFIG.RETRY_DELAY_MS);
      return fetchGalleryWithRetry(retriesLeft - 1);
    }

    galleryLoader.classList.remove('active');
    reloadGalleryBtn.disabled = false;
    showToast(`Не удалось загрузить галерею: ${error.message}`, 'error');
  }
}

function renderGallery(images) {
  if (!Array.isArray(images) || images.length === 0) {
    galleryContainer.innerHTML = '<p>Изображения не найдены</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  images.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = item.url || '';
    img.alt = item.alt || `Изображение ${index + 1}`;
    img.loading = 'lazy';

    const caption = document.createElement('p');
    caption.className = 'card-title';
    caption.textContent = item.description || item.alt || 'Без описания';

    card.appendChild(img);
    card.appendChild(caption);
    fragment.appendChild(card);
  });

  galleryContainer.appendChild(fragment);
}

reloadGalleryBtn.addEventListener('click', () => fetchGalleryWithRetry());

const tempForm = document.getElementById('temperatureForm');
const submitBtn = document.getElementById('submitBtn');
const roomInput = document.getElementById('roomInput');
const tempInput = document.getElementById('tempInput');

tempForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const classValue = roomInput.value.trim();
  const rawTempValue = tempInput.value.trim();

  if (!classValue || rawTempValue === '') {
    showToast('Пожалуйста, заполните все поля формы', 'error');
    return;
  }

  const numericTemp = parseFloat(rawTempValue);
  if (Number.isNaN(numericTemp)) {
    showToast('Температура должна быть числом', 'error');
    return;
  }

  const payload = {
    class: String(classValue),
    temp: numericTemp
  };

  submitBtn.disabled = true;
  roomInput.disabled = true;
  tempInput.disabled = true;

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/temp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const rawResponse = await response.text();
    let result = {};
    try {
      result = JSON.parse(rawResponse);
    } catch {
      result = { message: rawResponse };
    }

    if (!response.ok) {
      const errorMsg = result.message || `Ошибка сервера: ${response.status}`;
      throw new Error(errorMsg);
    }

    showToast(result.message || 'Данные температуры успешно отправлены!', 'success');
    tempForm.reset();
  } catch (err) {
    showToast(`Ошибка: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    roomInput.disabled = false;
    tempInput.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetchGalleryWithRetry();
});