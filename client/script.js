document.addEventListener("DOMContentLoaded", function () {
    fetchAndRenderSuperheroes();
  });

  function fetchAndRenderSuperheroes(searchQuery) {
    console.log("Searching for:", searchQuery);
    // Define the URL based on the selected search characteristic and the input query
    const searchCharacteristic = document.getElementById("searchType").value;
    const apiUrl = `http://localhost:3000/api/superheroes?${searchCharacteristic}=${searchQuery}`;

    const heroesList = document.getElementById("heroes-list");

  // Clear the existing content of the <ul> element
  heroesList.innerHTML = '';
  
    console.log(apiUrl);
    // Fetch JSON data from the Node.js server
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        // Function to create the HTML for a hero
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

      // Get the container where you want to add the hero elements
      const heroesList = document.getElementById("heroes-list");

      // Create and append hero elements for each hero in the JSON data
      data.forEach(heroData => {
        const heroElement = createHeroElement(heroData);
        heroesList.appendChild(heroElement);
      });
  
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }
  
  function searchHero() {
    // Get the user input from the text field
    const searchQuery = document.getElementById("heroInput").value;
  
    // Call the fetchAndRenderSuperheroes function with the search query
    fetchAndRenderSuperheroes(searchQuery);
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    fetchAndRenderSuperheroes(""); // Initially load all heroes when the page loads
  });