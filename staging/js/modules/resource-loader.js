/**
 * Loads a JSON file from the specified URL.
 * @param {string} url - The URL of the JSON file to load.
 * @returns {Promise<any>} A promise that resolves to the parsed JSON data, or null if loading fails.
 */
export async function loadJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load JSON from ${url}:`, error);
    return null;
  }
}
