const overallStatus = document.getElementById("overallStatus");
const fallStatus = document.getElementById("fallStatus");
const movementStatus = document.getElementById("movementStatus");
const activityStatus = document.getElementById("activityStatus");

const currentMode = document.getElementById("currentMode");
const riskLevel = document.getElementById("riskLevel");
const lastAlert = document.getElementById("lastAlert");
const lastEvent = document.getElementById("lastEvent");
const systemMessage = document.getElementById("systemMessage");

const fallAlertOverlay = document.getElementById("fallAlertOverlay");
const closeAlertBtn = document.getElementById("closeAlertBtn");

const stateTitle = document.getElementById("stateTitle");
const stateDescription = document.getElementById("stateDescription");
const stateIndicator = document.getElementById("stateIndicator");

const connectionText = document.getElementById("connectionText");
const connectionDot = document.getElementById("connectionDot");

const eventList = document.getElementById("eventList");

let previousData = null;

// CAMBIA ESTA IP por la IP real de tu ESP32
const ESP32_IP = "http://192.168.1.50";
const DATA_URL = `${ESP32_IP}/status`;

const REFRESH_INTERVAL = 3000;

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showFallAlert() {
  fallAlertOverlay.classList.remove("hidden");
}

function hideFallAlert() {
  fallAlertOverlay.classList.add("hidden");
}

closeAlertBtn.addEventListener("click", hideFallAlert);

function addEvent(message, time = null) {
  const firstItem = eventList.querySelector("li .event-text");
  if (firstItem && firstItem.textContent === "Esperando eventos del sistema") {
    eventList.innerHTML = "";
  }

  const li = document.createElement("li");
  li.innerHTML = `
    <span class="event-time">${time || getCurrentTime()}</span>
    <span class="event-text">${message}</span>
  `;

  eventList.prepend(li);

  while (eventList.children.length > 8) {
    eventList.removeChild(eventList.lastChild);
  }
}

function setConnectionStatus(isOnline, text) {
  connectionText.textContent = text;
  connectionDot.classList.remove("status-online", "status-offline");
  connectionDot.classList.add(isOnline ? "status-online" : "status-offline");
}

function setTextStyle(element, styleClass) {
  element.className = `card-value ${styleClass}`;
}

function updateStatePanel(mode, title, description) {
  stateTitle.textContent = title;
  stateDescription.textContent = description;

  stateIndicator.classList.remove("normal-bg", "alert-bg", "warning-bg");

  if (mode === "alert") {
    stateIndicator.classList.add("alert-bg");
  } else if (mode === "warning") {
    stateIndicator.classList.add("warning-bg");
  } else {
    stateIndicator.classList.add("normal-bg");
  }
}

function formatMode(mode) {
  if (mode === "fall") return "Detección de caída";
  if (mode === "camera") return "Cámara";
  return mode || "Sin datos";
}

function evaluateMovement(standingEMA, lyingEMA) {
  if (lyingEMA > 0.7) return "Usuario en el suelo";
  if (standingEMA > 0.6) return "Usuario en pie";
  if (lyingEMA > 0.4) return "Movimiento sospechoso";
  return "Movimiento estable";
}

function evaluateActivity(standingEMA, lyingEMA, fallDetected) {
  if (fallDetected) return "Posible caída detectada";
  if (lyingEMA > 0.7) return "Postura horizontal";
  if (standingEMA > 0.6) return "Actividad normal";
  return "Monitoreando postura";
}

function evaluateRisk(fallDetected, standingEMA, lyingEMA) {
  if (fallDetected) return "Alto";
  if (lyingEMA > 0.45) return "Medio";
  return "Bajo";
}

function buildEventMessage(fallDetected, standingEMA, lyingEMA) {
  if (fallDetected) return "Caída detectada por AURA";
  if (lyingEMA > 0.7) return "Usuario detectado en posición horizontal";
  if (standingEMA > 0.6) return "Usuario en condición estable";
  return "Monitoreo activo del sistema";
}

function applyData(data) {
  const fallDetected = Boolean(data.fall_detected);
  const standingEMA = Number(data.standing_ema || 0);
  const lyingEMA = Number(data.lying_ema || 0);
  const mode = data.mode || "Sin datos";

  const movement = evaluateMovement(standingEMA, lyingEMA);
  const activity = evaluateActivity(standingEMA, lyingEMA, fallDetected);
  const risk = evaluateRisk(fallDetected, standingEMA, lyingEMA);
  const eventMessage = buildEventMessage(fallDetected, standingEMA, lyingEMA);

  movementStatus.textContent = movement;
  activityStatus.textContent = activity;
  currentMode.textContent = formatMode(mode);
  riskLevel.textContent = risk;
  lastEvent.textContent = eventMessage;

  if (fallDetected) {
    overallStatus.textContent = "Alerta detectada";
    fallStatus.textContent = "Caída detectada";
    lastAlert.textContent = "Caída detectada";

    setTextStyle(overallStatus, "text-alert");
    setTextStyle(fallStatus, "text-alert");
    setTextStyle(movementStatus, "text-warning");
    setTextStyle(activityStatus, "text-warning");

    systemMessage.textContent =
      "AURA detectó una posible caída. Se recomienda revisar al usuario de inmediato.";

    updateStatePanel(
      "alert",
      "Emergencia potencial",
      "Se detectó un evento de caída o anomalía que requiere atención inmediata."
    );

    showFallAlert();
  } else if (lyingEMA > 0.45) {
    hideFallAlert();

    overallStatus.textContent = "Fuera de rango";
    fallStatus.textContent = "No detectada";
    lastAlert.textContent = "Sin alerta activa";

    setTextStyle(overallStatus, "text-warning");
    setTextStyle(fallStatus, "text-safe");
    setTextStyle(movementStatus, "text-warning");
    setTextStyle(activityStatus, "text-warning");

    systemMessage.textContent =
      "AURA detectó un comportamiento fuera del rango esperado. Se recomienda monitoreo preventivo.";

    updateStatePanel(
      "warning",
      "Precaución",
      "El sistema detecta actividad atípica, aunque no se ha identificado una caída."
    );
  } else {
    hideFallAlert();

    overallStatus.textContent = "Todo en rango normal";
    fallStatus.textContent = "No detectada";
    lastAlert.textContent = "Sin alertas";

    setTextStyle(overallStatus, "text-normal");
    setTextStyle(fallStatus, "text-safe");
    setTextStyle(movementStatus, "text-normal");
    setTextStyle(activityStatus, "text-safe");

    systemMessage.textContent =
      "AURA monitorea continuamente el entorno y reporta condiciones normales.";

    updateStatePanel(
      "normal",
      "Condición estable",
      "No se detectan anomalías ni eventos de riesgo en este momento."
    );
  }

  const eventTime = getCurrentTime();

  const isNewEvent =
    !previousData ||
    previousData.fall_detected !== data.fall_detected ||
    previousData.standing_ema !== data.standing_ema ||
    previousData.lying_ema !== data.lying_ema;

  if (isNewEvent) {
    addEvent(eventMessage, eventTime);
  }

  previousData = data;
}

async function fetchData() {
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("No se pudieron obtener los datos");
    }

    const data = await response.json();
    applyData(data);
    setConnectionStatus(true, "Datos recibidos correctamente");
  } catch (error) {
    setConnectionStatus(false, "Sin conexión con AURA");
    console.error("Error al cargar datos:", error);
  }
}

fetchData();
setInterval(fetchData, REFRESH_INTERVAL);