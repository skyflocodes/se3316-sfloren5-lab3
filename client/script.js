// Function to fetch and render superheroes based on search query.
function fetchAndRenderSuperheroes(searchQuery) {
  // Get search and sort characteristics from HTML elements
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

// Function to create HTML elements for a hero.
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

// Function to trigger search when "Search" button is clicked.
function searchHero() {
  const searchQuery = document.getElementById("heroInput").value;
  fetchAndRenderSuperheroes(searchQuery);
}

// Event listener for when the page loads to fetch and render superheroes.
document.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderSuperheroes("");
});
