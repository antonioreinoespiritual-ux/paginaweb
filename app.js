const settingsForm = document.getElementById("settings-form");
const chatForm = document.getElementById("chat-form");
const apiKeyInput = document.getElementById("apiKey");
const nombreInput = document.getElementById("nombre");
const previewToggle = document.getElementById("preview-mode");
const messageInput = document.getElementById("mensaje");
const chatWindow = document.getElementById("chat-window");
const settingsStatus = document.getElementById("settings-status");

const STORAGE_KEY = "esperanza-deepseek-config";
const API_URL = "https://api.deepseek.com/v1/chat/completions";

const baseSystemPrompt = `Eres una persona cercana y empática. Respondes en español con un tono
suave, esperanzador y realista. La persona habla sobre su ex o una pérdida amorosa. Evita dar
consejos peligrosos o promesas falsas. Ofrece calma, validación emocional y pequeñas sugerencias
para cuidarse.`;

const previewReplies = [
  "Gracias por compartirlo. Lo que sientes es válido y merece cuidado.",
  "A veces el amor deja huellas profundas. Aquí puedes darte permiso de sanar poco a poco.",
  "No estás sola ni solo. Respira y date el tiempo que necesites para aceptar lo vivido.",
];

function loadSettings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    const data = JSON.parse(stored);
    apiKeyInput.value = data.apiKey || "";
    nombreInput.value = data.nombre || "";
    previewToggle.checked = Boolean(data.previewMode);
  } catch (error) {
    console.warn("No se pudo leer la configuración", error);
  }
}

function saveSettings(event) {
  event.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  const nombre = nombreInput.value.trim();
  const previewMode = previewToggle.checked;

  if (!previewMode && !apiKey) {
    settingsStatus.textContent = "Agrega tu API key o habilita la vista previa.";
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, nombre, previewMode }));
  settingsStatus.textContent = previewMode
    ? "Vista previa activada. Puedes probar el chat sin API key."
    : "Configuración guardada. Puedes empezar la conversación.";
}

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message message--${type}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getPreviewReply() {
  const randomIndex = Math.floor(Math.random() * previewReplies.length);
  return previewReplies[randomIndex];
}

async function sendMessage(event) {
  event.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  const previewMode = previewToggle.checked;
  if (!previewMode && !apiKey) {
    settingsStatus.textContent = "Necesitas una API key válida o activar la vista previa.";
    return;
  }

  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  messageInput.value = "";

  addMessage("Estoy aquí contigo. Dame un momento para responder...", "assistant");
  const assistantBubble = chatWindow.lastChild;

  if (previewMode) {
    setTimeout(() => {
      assistantBubble.textContent = getPreviewReply();
    }, 600);
    return;
  }

  const nombre = nombreInput.value.trim();
  const systemPrompt = nombre
    ? `${baseSystemPrompt}\nLa persona se llama ${nombre}. Usa su nombre solo si suena natural.`
    : baseSystemPrompt;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data?.choices?.[0]?.message?.content?.trim();
    assistantBubble.textContent =
      assistantReply ||
      "Sigo aquí contigo. Si quieres, intenta contarme un poco más para poder ayudarte.";
  } catch (error) {
    console.error(error);
    assistantBubble.textContent =
      "No pude conectar con DeepSeek en este momento. Verifica tu API key o intenta más tarde.";
  }
}

settingsForm.addEventListener("submit", saveSettings);
chatForm.addEventListener("submit", sendMessage);
loadSettings();
addMessage(
  "Hola, estoy aquí para escucharte. Cuéntame qué sientes sobre esa persona especial.",
  "assistant"
);
