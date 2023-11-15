const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { query, validationResult } = require('express-validator');

const app = express();
const port = 3000;

// Middlewares
app.use(express.json()); // Duplicate line from below was removed
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

const cors = require('cors');
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// MongoDB Client Setup
const uri = 'mongodb+srv://skyflocodes:3316@heros.zqhg1yp.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1
});

// Data directory paths
const DATA_DIR = path.join(__dirname, 'json');
const SUPERHERO_INFO_FILE = path.join(DATA_DIR, 'superhero_info.json');
const SUPERHERO_POWERS_FILE = path.join(DATA_DIR, 'superhero_powers.json');

// Utility Functions
const readJsonFile = (filePath) => fs.promises.readFile(filePath, 'utf8').then(JSON.parse);
const sanitizeInput = (value) => value.replace(/[^a-zA-Z0-9\-\.]/g, '');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

let cache = {}; // In-memory cache

const loadSuperheroData = async () => {
  if (!cache.superheroes || !cache.powers) {
    [cache.superheroes, cache.powers] = await Promise.all([
      readJsonFile(SUPERHERO_INFO_FILE),
      readJsonFile(SUPERHERO_POWERS_FILE)
    ]);
  }
  return cache;
};

// Database connection and server start
async function startServer() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server is running on port ${port}`));
  } catch (err) {
    fs.writeFileSync('mongo_connection_error.log', JSON.stringify(err, null, 2));
    console.error('Error connecting to MongoDB', err);
    process.exit(1);
  }
}

    app.post('/api/lists', async (req, res) => {
        const { listName } = req.body;

        // Check for minimum length and allowed characters
        if (listName.length < 3 || !/^[a-z\d ]+$/i.test(listName)) {
          return res.status(400).json({ message: 'List name must be at least 3 characters long and contain only alphanumeric characters and spaces.' });
        }

        try {
          const listsCollection = client.db('superheroesDB').collection('lists');
          // Check if a list with the same name already exists
          const listExists = await listsCollection.findOne({ name: listName });
          if (listExists) {
            return res.status(409).json({ message: 'List already exists' });
          }
          // Create a new list with an empty array of superhero IDs
          const newList = { name: listName, superheroIds: [] };
          await listsCollection.insertOne(newList);
          res.status(201).json(newList);
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error', details: error.message  });
        }
      });

      app.get('/api/lists/:listName', async (req, res) => {
        const { listName } = req.params;
        try {
          const listsCollection = client.db('superheroesDB').collection('lists');

          // Check for minimum length and allowed characters
        if (listName.length < 3 || !/^[a-z\d ]+$/i.test(listName)) {
          return res.status(400).json({ message: 'List name must be at least 3 characters long and contain only alphanumeric characters and spaces.' });
        }
          
          // Find the list by name
          const list = await listsCollection.findOne({ name: listName }, { projection: { superheroIds: 1 } });
          if (!list) {
            return res.status(404).json({ message: 'List not found' });
          }
      
          res.status(200).json(list.superheroIds);
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error', details: error.message  });
        }
      });

      app.post('/api/lists/:listName/superheroes', async (req, res) => {
        const { listName } = req.params;
        let { superheroId } = req.body; // The user provides a superheroId in the body

        // Convert superheroId to an integer.
        superheroId = parseInt(superheroId, 10);
      
        if (superheroId < 0 || isNaN(superheroId) || superheroId > 733 || superheroId === null || superheroId == "") {
          return res.status(400).json({ message: 'Invalid superhero ID' });
        }
      
        try {
          const listsCollection = client.db('superheroesDB').collection('lists');
          // Add the superhero ID to the list if it doesn't already contain it
          const updateResult = await listsCollection.updateOne(
            { name: listName, superheroIds: { $ne: superheroId } },
            { $push: { superheroIds: superheroId } }
          );
      
          if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'List not found' });
          }
      
          if (updateResult.modifiedCount === 0) {
            return res.status(409).json({ message: 'Superhero ID already in the list' });
          }
      
          res.status(200).json({ message: 'Superhero ID added to the list' });
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error', details: error.message });
        }
      });

      app.delete('/api/lists/:listName/superheroes/:superheroId', async (req, res) => {
        const { listName } = req.params;
        const superheroId = parseInt(req.params.superheroId, 10);
      
        try {
          const listsCollection = client.db('superheroesDB').collection('lists');
          // Remove the superhero ID from the list
          const updateResult = await listsCollection.updateOne(
            { name: listName },
            { $pull: { superheroIds: superheroId } }
          );
      
          if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'List not found' });
          }
      
          if (updateResult.modifiedCount === 0) {
            return res.status(409).json({ message: 'Superhero ID not in the list' });
          }
      
          res.status(200).json({ message: 'Superhero ID removed from the list' });
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error', details: error.message });
        }
      });      

      app.delete('/api/lists/:listName', async (req, res) => {
        const { listName } = req.params;

        // Check for minimum length and allowed characters
        if (listName.length < 3 || !/^[a-z\d ]+$/i.test(listName)) {
          return res.status(400).json({ message: 'List name must be at least 3 characters long and contain only alphanumeric characters and spaces.' });
        }
      
        try {
          const listsCollection = client.db('superheroesDB').collection('lists');
          
          // Delete the list by name
          const result = await listsCollection.deleteOne({ name: listName });
          if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'List not found' });
          }
      
          res.status(200).json({ message: 'List deleted' });
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error', details: error.message  });
        }
      });

      app.get('/api/lists/:listName/details', async (req, res) => {
        const { listName } = req.params;
        try {
            const listsCollection = client.db('superheroesDB').collection('lists');
            const list = await listsCollection.findOne({ name: listName });
    
            if (!list) {
                return res.status(404).json({ message: 'List not found' });
            }
    
            // Fetch the superhero details for each ID
            const superheroesDetails = await Promise.all(list.superheroIds.map(async (id) => {
                return await getSuperheroById(id); // This uses the local function instead of fetchSuperheroById
            }));
    
            // Filter out any undefined entries if a superhero was not found
            const details = superheroesDetails.filter(Boolean);
    
            res.status(200).json(details);
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error', details: error.message  });
        }
    });

// Define an API endpoint to get a list of superheroes with optional filtering and sorting
app.get('/api/superheroes',
[
    query('id').optional().isInt({ min: 0, max: 733 }),
    query('name').optional().isString().trim().customSanitizer(sanitizeInput),
    query('power').optional().isString().trim().customSanitizer(sanitizeInput),
    query('race').optional().isString().trim().customSanitizer(sanitizeInput),
    query('publisher').optional().isString().trim().customSanitizer(sanitizeInput),
    query('sort').optional().isString().trim().customSanitizer(sanitizeInput),
    query('limit').optional().isInt({ min: 0, max: 733 }),
], asyncHandler(async (req, res) => {
    // Validate query parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { superheroes, powers } = await loadSuperheroData();
    const { id, name, power, race, publisher, sort, limit } = req.query;

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

    if(id){
        const numericId = parseInt(id, 10);
        result = result.filter(hero => hero.id && hero.id === numericId);
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

    // Apply the "limit" to limit the number of results
    if (limit) {
        if (limit > 0)
        result = result.slice(0, parseInt(limit, 10));
    }

    // Send the filtered and sorted result as JSON response
    res.json(result);
}));

// Generic error handler middleware for the application
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message  });
});

startServer();