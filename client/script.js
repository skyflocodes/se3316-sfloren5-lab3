// Function to fetch and render superheroes based on search query.
function fetchAndRenderSuperheroes(searchQuery) {
  // Get search and sort characteristics from HTML elements
  const searchCharacteristic = document.getElementById("searchType").value;
  const sortCharacteristic = document.getElementById("sortType").value;
  const searchSize = parseInt(document.getElementById("searchSize").value, 10);

  // Construct the API URL with search query and sorting.
  let apiUrl = `http://ec2-44-219-158-250.compute-1.amazonaws.com:3000/api/superheroes?${searchCharacteristic}=${searchQuery}&limit=${searchSize}`;

  if (sortCharacteristic) {
    apiUrl += `&sort=${sortCharacteristic}`;
  }

  const inputField = document.getElementById("heroInput");

  inputField.addEventListener("keydown", function (event) {
    const disallowedCharacters = /[^a-zA-Z0-9-\.]/g; // Define the characters you want to disallow
    
    if (disallowedCharacters.test(event.key)) {
      event.preventDefault(); // Prevent the character from being inputted
    }
  });

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
  console.log("Received heroData:", heroData); // Add this line for debugging
  const heroListItem = document.createElement("li");
  heroListItem.className = "hero";

  const heroContent = document.createElement("div");

  const heroName = document.createElement("h3");
  heroName.className = "name";
  heroName.textContent = heroData.name;
  console.log(heroData.name);

  const heroInfo = document.createElement("p");
  heroInfo.innerHTML = `ID: ${heroData.id}<br>Race: ${heroData.Race}<br>Publisher: ${heroData.Publisher}`;

  const heroPowers = document.createElement("p");
  heroPowers.className = "powers";

  if (heroData.powers && Array.isArray(heroData.powers)) {
    heroPowers.innerHTML = `<strong>Powers:</strong><br>${heroData.powers.join(", ")}`;
  } else {
    heroPowers.innerHTML = `<strong>Powers:</strong><br>No powers available`;
  }

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

// Display a message to the user
function displayMessage(message) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = message;
  messageElement.style.display = 'block';
  setTimeout(() => { messageElement.style.display = 'none'; }, 5000); // Message will disappear after 5 seconds
}

let apiUrl = `/api/lists`;

// Create a new list
function createList() {
  const listName = document.getElementById('listName').value;
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listName: listName }),
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => Promise.reject(new Error(text)));
    }
    return response.json();
  })
  .then(data => {
    displayMessage(`List "${data.name}" was added.`);
  })
  .catch((error) => {
    displayMessage(`Error.`);
  });
}

// Delete an existing list
function deleteList() {
  const listName = document.getElementById('listName').value;
  fetch(apiUrl + `/${listName}`, {
    method: 'DELETE',
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => Promise.reject(new Error(text)));
    }
    return response.json();
  })
  .then(data => {
    displayMessage(`List "${listName}" was deleted.`);
  })
  .catch((error) => {
    displayMessage(`Error.`);
  });
}

// Add a hero to a list
function addHeroToList() {
  const listName = document.getElementById('listName').value;
  const superheroId = document.getElementById('superheroId').value;
  fetch(apiUrl +`/${listName}/superheroes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ superheroId: superheroId }),
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => Promise.reject(new Error(text)));
    }
    return response.json();
  })
  .then(data => {
    displayMessage(`Hero ID:${superheroId} added to "${listName}".`);
  })
  .catch((error) => {
    displayMessage(`Error.`);
  });
}

// Remove a hero from a list
function removeHeroFromList() {
  const listName = document.getElementById('listName').value;
  const superheroId = document.getElementById('superheroId').value;
  fetch(apiUrl + `/${listName}/superheroes/${superheroId}`, {
    method: 'DELETE',
  })
  .then(response => {
    if (response.status === 409) {
      throw new Error('The hero may not exist in the list or cannot be removed due to a rule.');
    }
    if (!response.ok) {
      return response.text().then(text => Promise.reject(new Error(text)));
    }
    return response.json();
  })
  .then(data => {
    displayMessage(`Hero ID:${superheroId} removed from "${listName}".`);
  })
  .catch((error) => {
    displayMessage(`Error.`);
  });
}

  // Function to display a given list
function displayList() {
  const listNameInput = document.getElementById("listName");
  const listName = listNameInput.value;
  
  // Check if the user provided a list name
  if (!listName) {
    displayMessage(`Error: Please enter a list name.`);
    return;
  }

  // Fetch the list data from the server
  fetch(apiUrl + `/${listName}`)
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => Promise.reject(new Error(text)));
      }
      return response.json();
    })
    .then(data => {
      // Clear existing hero list.
      const heroesList = document.getElementById("heroes-list");
      heroesList.innerHTML = '';

      // Fetch and render superhero details for each ID in the list
      data.forEach(superheroId => {
        fetchSuperheroById(superheroId)
          .then(heroData => {
            const heroElement = createHeroElement(heroData[0]);
            heroesList.appendChild(heroElement);
          })
          .catch(error => {
            console.error('Error fetching superhero details:', error);
          });
      });
    })
    .catch(error => {
      displayMessage(`Error: ${error.message}`);
    });
}

// Function to fetch superhero details by ID
function fetchSuperheroById(superheroId) {
  const apiUrl = `/api/superheroes?id=${superheroId}`;
  
  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching superhero with ID ${superheroId}`);
      }
      return response.json();
    });
}