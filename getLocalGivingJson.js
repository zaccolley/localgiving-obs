const { JSDOM } = require("jsdom");
const Cache = require("cache");

// create a cache that gets flushed every minute
const cache = new Cache(60 * 1000);

function getUrl(urlId) {
  return `https://localgiving.org/fundraising/${urlId}/`;
}

function getCharityDescription(charityElement) {
  const textElement = charityElement.querySelector("p");

  if (!textElement) {
    return null;
  }

  const descriptionLinkElement = textElement.querySelector("a");
  const descriptionLinkText = descriptionLinkElement.textContent;

  return textElement.textContent.replace(descriptionLinkText, "").trim();
}

function getCharityName(charityElement) {
  const linkElement = charityElement.querySelector(".ui-section-title a");
  return linkElement ? linkElement.textContent : null;
}

function getCharityImage(charityElement) {
  const imageElement = charityElement.querySelector("img");
  return imageElement ? imageElement.src : null;
}

function getCharity(document) {
  const charityElement = document.querySelector(".ui-tab-charity");
  const name = getCharityName(charityElement);
  const description = getCharityDescription(charityElement);
  const image = getCharityImage(charityElement);

  return {
    name,
    description,
    image
  };
}

function getStats(document) {
  const STATS_LABEL_MAP = {
    raised: "totalAmountRaised",
    donors: "totalDonations",
    target: "targetAmountRaised"
  };

  const stats = {};
  const statLabelElements = document.querySelectorAll(
    ".ui-fundraiser-stat-label"
  );
  statLabelElements.forEach(labelElement => {
    const { parentElement } = labelElement;
    const valueElement = parentElement.querySelector(".ui-fundraiser-stat");

    if (!valueElement) return;

    const key = STATS_LABEL_MAP[labelElement.textContent.toLowerCase()];

    stats[key] = valueElement.textContent;
  });

  return stats;
}

function getAmountRaisedPercentage(document) {
  const progressBarElement = document.querySelector('[role="progressbar"]');
  const value = parseInt(progressBarElement.getAttribute("aria-valuenow"), 10);
  const totalValue = parseInt(
    progressBarElement.getAttribute("aria-valuemax"),
    10
  );

  if (typeof value === "NaN" || typeof totalValue === "NaN") return;

  return (value / totalValue) * 100;
}

function getDonationUrl(document) {
  return document.querySelector(".ui-main-don-btn").href;
}

function getDonations(document) {
  if (document.body.textContent.includes("Be the first to donate!")) {
    return [];
  }

  const donationsElements = [
    ...document.querySelectorAll(
      ".ui-donations-wrapper .ui-fundraiser-donation"
    )
  ];

  return donationsElements.map(donationElement => {
    const donationNameElement = donationElement.querySelector(
      ".ui-fundraiser-donation-name"
    );

    const isTopDonation = !!(
      donationNameElement.querySelector("strong") &&
      donationNameElement.textContent.includes("Top Donor")
    );

    const name = donationNameElement.textContent
      .replace("Top Donor", "")
      .trim();

    const isAnonymous = name.includes("Anonymous donor");

    const dateElement = donationElement.querySelector(
      ".ui-fundraiser-donation-date"
    );
    const createdAt = new Date(dateElement.textContent).toISOString();

    const donationAmountElement = donationElement.querySelector(
      ".ui-donation-amount"
    );
    const donationAmount = donationAmountElement.textContent;

    const messageElement = donationElement.querySelector(
      ".pull-left:not(.ui-fundraiser-donation-name)"
    );
    const message = messageElement.textContent
      .replace(donationAmount, "")
      .trim();

    return {
      createdAt,
      name,
      message,
      amount: donationAmount,
      isTopDonation,
      isAnonymous
    };
  });
}

async function getLocalGivingJson(urlId) {
  const url = getUrl(urlId);
  const dom = await JSDOM.fromURL(url);
  const { document } = dom.window;

  const charity = getCharity(document);
  const stats = getStats(document);
  const donations = getDonations(document);
  const amountRaisedPercentage = getAmountRaisedPercentage(document);

  const json = {
    charity,
    updatedAt: new Date().toISOString(),
    url,
    donationUrl: getDonationUrl(document),
    donations,
    totalDonations: parseInt(stats.totalDonations, 10),
    amountRaised: {
      total: stats.totalAmountRaised,
      target: stats.targetAmountRaised,
      percentage: amountRaisedPercentage
    }
  };

  return json;
}

async function getCachedLocalGivingJson(urlId) {
  // if json is in cache use that
  const cachedJson = cache.get(urlId);
  if (cachedJson) {
    return cachedJson;
  }

  const json = await getLocalGivingJson(urlId);

  // cache the response
  cache.put(urlId, json);

  return json;
}

module.exports = getCachedLocalGivingJson;
