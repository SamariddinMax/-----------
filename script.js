
const units = {
  length: {
    label: "Длина",
    units: {
      mm: { name: "Миллиметры (мм)", short: "мм", factor: 0.001 },
      cm: { name: "Сантиметры (см)", short: "см", factor: 0.01 },
      m:  { name: "Метры (м)", short: "м", factor: 1 },
      km: { name: "Километры (км)", short: "км", factor: 1000 },
      inch: { name: "Дюймы (in)", short: "in", factor: 0.0254 },
      ft: { name: "Футы (ft)", short: "ft", factor: 0.3048 },
      mi: { name: "Мили (mi)", short: "mi", factor: 1609.344 }
    },
    defaults: ["m", "cm"]
  },

  weight: {
    label: "Вес",
    units: {
      mg: { name: "Миллиграммы (мг)", short: "мг", factor: 0.000001 },
      g:  { name: "Граммы (г)", short: "г", factor: 0.001 },
      kg: { name: "Килограммы (кг)", short: "кг", factor: 1 },
      t:  { name: "Тонны (т)", short: "т", factor: 1000 },
      oz: { name: "Унции (oz)", short: "oz", factor: 0.028349523125 },
      lb: { name: "Фунты (lb)", short: "lb", factor: 0.45359237 }
    },
    defaults: ["kg", "g"]
  },

  temperature: {
    label: "Температура",
    units: {
      C: { name: "Цельсий (°C)", short: "°C" },
      F: { name: "Фаренгейт (°F)", short: "°F" },
      K: { name: "Кельвин (K)", short: "K" }
    },
    defaults: ["C", "F"]
  }
};

const category = document.querySelector("#category");
const amount = document.querySelector("#amount");
const fromUnit = document.querySelector("#fromUnit");
const toUnit = document.querySelector("#toUnit");
const output = document.querySelector("#output");
const error = document.querySelector("#error");
const resultHint = document.querySelector("#resultHint");
const toast = document.querySelector("#toast");

let lastResult = "";
let toastTimer;

// Заполнение списка единиц
function fillUnits(keepSelection = false) {
  const config = units[category.value];

  if (!config) return;

  const previousFrom = keepSelection ? fromUnit.value : "";
  const previousTo = keepSelection ? toUnit.value : "";

  for (const select of [fromUnit, toUnit]) {
    select.replaceChildren();

    Object.entries(config.units).forEach(([key, unit]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = unit.name;
      select.append(option);
    });
  }

  fromUnit.value = config.units[previousFrom]
    ? previousFrom
    : config.defaults[0];

  toUnit.value = config.units[previousTo]
    ? previousTo
    : config.defaults[1];

  convert();
}

// Конвертация температуры
function convertTemperature(value, from, to) {
  let celsius;

  if (from === "C") celsius = value;
  else if (from === "F") celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;

  if (to === "C") return celsius;
  if (to === "F") return celsius * 9 / 5 + 32;

  return celsius + 273.15;
}

// Форматирование числа
function formatNumber(value) {
  if (Object.is(value, -0)) value = 0;

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 8,
    useGrouping: true
  }).format(value);
}

// Основная конвертация
function convert() {
  error.textContent = "";

  const value = Number(amount.value);

  if (amount.value.trim() === "" || !Number.isFinite(value)) {
    output.textContent = "Введи число 👆";
    resultHint.textContent = "Мы сразу рассчитаем результат.";
    lastResult = "";
    return;
  }

  const from = fromUnit.value;
  const to = toUnit.value;

  let result;

  if (category.value === "temperature") {
    result = convertTemperature(value, from, to);
  } else {
    const config = units[category.value].units;
    result = value * config[from].factor / config[to].factor;
  }

  if (!Number.isFinite(result)) {
    error.textContent =
      "Не получилось вычислить это значение. Проверь ввод.";

    output.textContent = "—";
    lastResult = "";
    return;
  }

  const config = units[category.value].units;

  lastResult =
    `${formatNumber(value)} ${config[from].short} = ` +
    `${formatNumber(result)} ${config[to].short}`;

  output.textContent = lastResult;
  resultHint.textContent = "Готово! Можешь скопировать результат 📋";

  const resultBox = document.querySelector("#result");

  if (resultBox) {
    resultBox.style.animation = "none";
    void resultBox.offsetWidth;
    resultBox.style.animation = "";
  }
}

// Всплывающее сообщение
function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2100);
}

// События конвертера
category.addEventListener("change", () => fillUnits(false));

document.querySelector("#convert").addEventListener("click", convert);
amount.addEventListener("input", convert);
fromUnit.addEventListener("change", convert);
toUnit.addEventListener("change", convert);

// Обмен единиц местами
document.querySelector("#swap").addEventListener("click", () => {
  const previous = fromUnit.value;

  fromUnit.value = toUnit.value;
  toUnit.value = previous;

  convert();
});

// Копирование результата
document.querySelector("#copy").addEventListener("click", async () => {
  if (!lastResult) {
    showToast("Сначала введи число 🙂");
    return;
  }

  try {
    await navigator.clipboard.writeText(lastResult);
    showToast("Результат скопирован! ✅");
  } catch {
    const temporary = document.createElement("textarea");

    temporary.value = lastResult;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";

    document.body.append(temporary);
    temporary.select();

    const copied = document.execCommand("copy");
    temporary.remove();

    showToast(
      copied
        ? "Результат скопирован! ✅"
        : "Не удалось скопировать. Выдели результат вручную."
    );
  }
});

// Курсор-медвежонок 🐻
function initBearCursor() {
  const bear = document.querySelector("#bear-cursor");

  if (!bear) return;

  // Не заменяем курсор на сенсорных устройствах
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) {
    bear.remove();
    return;
  }

  let mouseX = 0;
  let mouseY = 0;
  let animationFrame = null;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if (animationFrame !== null) return;

    animationFrame = requestAnimationFrame(() => {
      bear.style.left = `${mouseX}px`;
      bear.style.top = `${mouseY}px`;
      animationFrame = null;
    });
  });

  const interactiveElements = document.querySelectorAll(
    "button, a, select, label, input, textarea, [role='button']"
  );

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      bear.classList.add("hovering");
    });

    element.addEventListener("mouseleave", () => {
      bear.classList.remove("hovering");
    });
  });

  document.addEventListener("mousedown", () => {
    bear.classList.add("clicking");
  });

  document.addEventListener("mouseup", () => {
    bear.classList.remove("clicking");
  });

  document.addEventListener("mouseleave", () => {
    bear.style.opacity = "0";
  });

  document.addEventListener("mouseenter", () => {
    bear.style.opacity = "1";
  });
}

// Запуск
fillUnits();
initBearCursor();
