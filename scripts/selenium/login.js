const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
require("chromedriver");

const DEFAULT_PASSWORD = "Mi1n3e&Cr4\\tf$";

function envFlag(name) {
  const value = process.env[name];
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

function envNumber(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isNaN(value) ? fallback : value;
}

async function run() {
  const username = process.env.SELENIUM_USERNAME || "Selenium";
  const password = process.env.SELENIUM_PASSWORD || DEFAULT_PASSWORD;
  const baseUrl = process.env.SELENIUM_BASE_URL || `http://localhost:${process.env.WEB_SERVER_PORT || 3011}`;
  const keepOpenMs = envNumber("SELENIUM_KEEP_OPEN_MS", 3000);

  const options = new chrome.Options();
  options.addArguments("--window-size=1280,900");
  if (envFlag("SELENIUM_HEADLESS")) {
    options.addArguments("--headless=new");
  }

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    console.log(`Opening ${baseUrl}`);
    await driver.get(baseUrl);

    await driver.wait(until.elementLocated(By.id("username")), 10000);
    await driver.findElement(By.id("username")).sendKeys(username);
    await driver.findElement(By.id("password")).sendKeys(password);
    await driver.findElement(By.id("login-button")).click();

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes("/admin");
    }, 15000);

    console.log("Login succeeded.");
    if (keepOpenMs > 0) {
      console.log(`Keeping the browser open for ${keepOpenMs}ms...`);
      await driver.sleep(keepOpenMs);
    }
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Selenium login failed:", err);
  process.exitCode = 1;
});
