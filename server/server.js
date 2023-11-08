const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

const DATA_DIR = path.join(__dirname, 'json');
const SUPERHERO_INFO_FILE = path.join(DATA_DIR, 'superhero_info.json');
const SUPERHERO_POWERS_FILE = path.join(DATA_DIR, 'superhero_powers.json');

// Utility to read and parse a JSON file
const readJsonFile = (filePath) => fs.promises.readFile(filePath, 'utf8').then(JSON.parse);

// Async error handling wrapper
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Cache the data in-memory to avoid file I/O for each request
let cache = {};

const loadSuperheroData = async () => {
  if (!cache.superheroes || !cache.powers) {
    cache.superheroes = await readJsonFile(SUPERHERO_INFO_FILE);
    cache.powers = await readJsonFile(SUPERHERO_POWERS_FILE);
  }
  return cache;
};

// Endpoint to get a list of all superheroes or filter by query parameters
app.get('/api/superheroes', asyncHandler(async (req, res) => {
    const { superheroes, powers } = await loadSuperheroData();
    const { name, power, race, publisher } = req.query;

    let result = superheroes;

    // Combine superhero info with their corresponding powers
    result = result.map((hero) => {
        const heroPowers = powers.find((p) => p.hero_names === hero.name);
        if (heroPowers) {
            hero.powers = Object.keys(heroPowers)
                .filter((key) => heroPowers[key] === "True" && key !== 'hero_names') // Ignore 'hero_names'
                .map((key) => key); // Map to just the power name
        } else {
            hero.powers = [];
        }
        return hero;
    });

    // Add filtering based on query parameters
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

    res.json(result);
}));

// Generic error handler middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});