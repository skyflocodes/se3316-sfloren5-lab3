const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Define file paths for superhero data
const DATA_DIR = path.join(__dirname, 'json');
const SUPERHERO_INFO_FILE = path.join(DATA_DIR, 'superhero_info.json');
const SUPERHERO_POWERS_FILE = path.join(DATA_DIR, 'superhero_powers.json');

// Utility function to read and parse a JSON file
const readJsonFile = (filePath) => fs.promises.readFile(filePath, 'utf8').then(JSON.parse);

// Async error handling wrapper for route handlers
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Cache the data in-memory to avoid frequent file I/O
let cache = {};

// Load superhero data into cache
const loadSuperheroData = async () => {
  if (!cache.superheroes || !cache.powers) {
    cache.superheroes = await readJsonFile(SUPERHERO_INFO_FILE);
    cache.powers = await readJsonFile(SUPERHERO_POWERS_FILE);
  }
  return cache;
};

// Define an API endpoint to get a list of superheroes with optional filtering and sorting
app.get('/api/superheroes', asyncHandler(async (req, res) => {
    const { superheroes, powers } = await loadSuperheroData();
    const { name, power, race, publisher, sort } = req.query;

    let result = superheroes;

    // Combine superhero info with their corresponding powers
    result = result.map((hero) => {
        const heroPowers = powers.find((p) => p.hero_names === hero.name);
        if (heroPowers) {
            hero.powers = Object.keys(heroPowers)
                .filter((key) => heroPowers[key] === "True" && key !== 'hero_names')
                .map((key) => key);
        } else {
            hero.powers = [];
        }
        return hero;
    });

    // Apply filtering based on query parameters
    if (name) {
        result = result.filter(hero => hero.name && hero.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (publisher) {
        result = result.filter(hero => hero.Publisher && hero.Publisher.toLowerCase().includes(publisher.toLowerCase()));
    }
    
    if (race) {
        result = result.filter(hero => hero.Race && hero.Race.toLowerCase().includes(race.toLowerCase()));
    }

    if (power) {
        result = result.filter(hero => {
            return hero.powers.some(heroPower => heroPower.toLowerCase().includes(power.toLowerCase()));
        });
    }

    // Apply sorting based on query parameters
    if (sort) {
        const validSortFields = ['name', 'race', 'publisher', 'power'];
        if (validSortFields.includes(sort.toLowerCase())) {
            result.sort((a, b) => {
                if (sort.toLowerCase() === 'power') {
                    return a.powers.length - b.powers.length;
                } else {
                    let fieldA = a[sort.charAt(0).toUpperCase() + sort.slice(1)];
                    let fieldB = b[sort.charAt(0).toUpperCase() + sort.slice(1)];
                    fieldA = fieldA ? fieldA.toString() : '';
                    fieldB = fieldB ? fieldB.toString() : '';
                    return fieldA.localeCompare(fieldB);
                }
            });
        } else {
            res.status(400).json({ error: `Invalid sort field. Valid fields are: ${validSortFields.join(', ')}` });
            return;
        }
    }

    // Send the filtered and sorted result as JSON response
    res.json(result);
}));

// Generic error handler middleware for the application
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server and listen on the defined port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
