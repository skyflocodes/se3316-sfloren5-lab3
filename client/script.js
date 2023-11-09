// Initial fetch and render superheroes when the page loads.
document.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderSuperheroes("");
});

// Fetch and render superheroes based on search query.
function fetchAndRenderSuperheroes(searchQuery) {
  const searchCharacteristic = document.getElementById("searchType").value;
  const sortCharacteristic = document.getElementById("sortType").value;

  // Construct the API URL with search query and sorting.
  let apiUrl = `http://localhost:3000/api/superheroes?${searchCharacteristic}=${searchQuery}`;

  if (sortCharacteristic) {
    apiUrl += `&sort=${sortCharacteristic}`;
  }

  // Clear existing hero list.
  const heroesList = document.getElementById("heroes-list");
  heroesList.innerHTML = '';

  // Fetch JSON data from the server and create hero elements.
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Create and append hero elements to the list.
      data.forEach(heroData => {
        const heroElement = createHeroElement(heroData);
        heroesList.appendChild(heroElement);
      });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Create HTML elements for a hero.
function createHeroElement(heroData) {
  const heroListItem = document.createElement("li");
  heroListItem.className = "hero";

  const heroContent = document.createElement("div");

  const heroName = document.createElement("h3");
  heroName.className = "name";
  heroName.textContent = heroData.name;

  const heroInfo = document.createElement("p");
  heroInfo.innerHTML = `ID: ${heroData.id}<br>Race: ${heroData.Race}<br>Publisher: ${heroData.Publisher}`;

  const heroPowers = document.createElement("p");
  heroPowers.className = "powers";
  heroPowers.innerHTML = `<strong>Powers:</strong><br>${heroData.powers.join(", ")}`;

  heroContent.appendChild(heroName);
  heroContent.appendChild(heroInfo);
  heroContent.appendChild(heroPowers);

  heroListItem.appendChild(heroContent);

  return heroListItem;
}

// Trigger search when "Search" button is clicked.
function searchHero() {
  const searchQuery = document.getElementById("heroInput").value;
  fetchAndRenderSuperheroes(searchQuery);
}