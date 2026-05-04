const https = require("https");

const API_BASE_URL = "https://nekos.best/api/v2";
const REQUEST_HEADERS = {
  "User-Agent": "BSG/1.0 (https://discord.com)"
};
const REQUEST_TIMEOUT_MS = 5000;

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: REQUEST_HEADERS
      },
      (response) => {
        let rawData = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawData += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`La API respondio con estado ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(rawData));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Tiempo de espera agotado despues de ${REQUEST_TIMEOUT_MS} ms`));
    });
    request.on("error", reject);
  });
}

async function getInteractionGif(definition) {
  try {
    const data = await requestJson(`${API_BASE_URL}/${definition.apiCategory}`);
    const gifUrl = data.results && data.results[0] && data.results[0].url;

    if (gifUrl) {
      return gifUrl;
    }
  } catch (error) {
    console.warn(`No se pudo obtener un GIF remoto para ${definition.name}:`, error.message);
  }

  return definition.fallbackGifUrl || null;
}

module.exports = { getInteractionGif };
