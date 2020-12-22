function createProgressBarElement(percentage) {
  const element = document.createElement("div");
  element.className = "progress-bar";
  element.innerHTML = `
    <div
      class="progress-bar__value"
      style="width: ${percentage}%;"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="${percentage}"
    >      
      <span
        class="progress-bar__value__text"
        style="right: ${percentage <= 80 ? "-2em" : "1em"};"
        aria-hidden="true"
      >
        ${percentage}%
      </span>
    </div>
  `;
  return element;
}

function createTopDonorHTML(topDonation) {
  if (!topDonation) {
    return "";
  }

  return `
    <div class="raised-amount-text">
      <span class="raised-amount-text__label">Top donation</span>
      <span class="raised-amount-text__value">
        ${topDonation.name} (${topDonation.amount})
      </span>
    </div>
  `;
}

function createCharityImage(charity) {
  if (!charity || !charity.image) {
    return "";
  }

  return `
    <img
      class="raised-amount-charity-image"
      src="${charity.image}"
      alt=""
    />
  `;
}

function createRaisedAmountElement({ charity, amountRaised, donations }) {
  const { total, target } = amountRaised;
  const topDonation = donations.find(donation => donation.isTopDonation);

  const element = document.createElement("div");
  element.className = "raised-amount";
  element.innerHTML = `
    <div class="raised-amount-text">
      <span class="raised-amount-text__label">Total Raised</span>
      <span class="raised-amount-text__value">${total}</span>
    </div>
    <div class="raised-amount-text">
      <span class="raised-amount-text__label">Target</span>
      <span class="raised-amount-text__value">${target}</span>
    </div>
    ${createTopDonorHTML(topDonation)}
    <span class="raised-amount-donate">!donate</span>
    ${createCharityImage(charity)}
  `;
  return element;
}

async function main() {
  const searchParams = new URLSearchParams(window.location.search);
  const urlId = searchParams.get("urlId");

  if (!urlId || urlId.length === 0) {
    console.error("No urlId param");
    return;
  }

  const response = await fetch(`/api/data/${urlId}`);
  const json = await response.json();

  if (!json || json.error) {
    console.error("API errored...");
    return;
  }

  const { charity, amountRaised, donations } = json;

  const progressBarElement = createProgressBarElement(amountRaised.percentage);
  const raisedAmountElement = createRaisedAmountElement({
    charity,
    amountRaised,
    donations
  });

  const progressElement = document.createElement("div");
  progressElement.className = "progress";
  progressElement.appendChild(progressBarElement);
  progressElement.appendChild(raisedAmountElement);

  // remove everything then put the new progress element in
  document.body.innerHTML = "";
  document.body.appendChild(progressElement);
}

function connectBot() {
  const searchParams = new URLSearchParams(window.location.search);
  const channel = searchParams.get("channel");
  const urlId = searchParams.get("urlId");

  if (!channel || channel.length === 0) {
    console.error("No channel param");
    return;
  }

  if (!urlId || urlId.length === 0) {
    console.error("No urlId  param");
    return;
  }

  fetch(`/api/connectBot?channel=${channel}&urlId=${urlId}`);
}

main();
// setInterval(main, 30 * 1000); // every 30 seconds

connectBot();
