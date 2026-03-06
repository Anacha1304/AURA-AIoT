const overallStatus = document.getElementById("overallStatus");
const fallStatus = document.getElementById("fallStatus");
const movementStatus = document.getElementById("movementStatus");
const activityStatus = document.getElementById("activityStatus");

const currentMode = document.getElementById("currentMode");
const riskLevel = document.getElementById("riskLevel");
const lastAlert = document.getElementById("lastAlert");
const lastEvent = document.getElementById("lastEvent");
const systemMessage = document.getElementById("systemMessage");

const stateTitle = document.getElementById("stateTitle");
const stateDescription = document.getElementById("stateDescription");
const stateIndicator = document.getElementById("stateIndicator");

const connectionText = document.getElementById("connectionText");
const connectionDot = document.getElementById("connectionDot");

const eventList = document.getElementById("eventList");

let previousData = null;

const DATA_URL = "data.json";
const REFRESH_INTERVAL = 3000;

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function addEvent(message, time = null) {
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

function applyData(data) {
  const fallDetected = Boolean(data.fallDetected);
  const normalRange = Boolean(data.normalRange);

  movementStatus.textContent = data.movement || "Sin datos";
  activityStatus.textContent = data.activity || "Sin datos";
  currentMode.textContent = data.currentMode || "Sin datos";
  riskLevel.textContent = data.riskLevel || "Sin datos";
  lastAlert.textContent = data.lastAlert || "Sin alertas";
  lastEvent.textContent = data.eventMessage || "Sin eventos";

  if (fallDetected) {
    overallStatus.textContent = "Alerta detectada";
    fallStatus.textContent = "Caída detectada";

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
  } else if (!normalRange) {
    overallStatus.textContent = "Fuera de rango";
    fallStatus.textContent = "No detectada";

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
    overallStatus.textContent = "Todo en rango normal";
    fallStatus.textContent = "No detectada";

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

  if (data.eventMessage) {
    const isNewEvent =
      !previousData ||
      previousData.eventMessage !== data.eventMessage ||
      previousData.eventTime !== data.eventTime;

    if (isNewEvent) {
      addEvent(data.eventMessage, data.eventTime || null);
    }
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