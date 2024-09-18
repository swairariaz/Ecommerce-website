const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Serve static files from the 'admin', 'css', 'images', and 'js' directories
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve the main website's HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const pages = ['about', 'makeup', 'new-arrivals', 'sale', 'shop', 'checkout', 'confirmation', 'contact', 'index'];
pages.forEach(page => {
    app.get(`/${page}.html`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

// Load inventory data from JSON file
const loadInventory = () => {
    try {
        const dataBuffer = fs.readFileSync('inventory.json');
        const dataJSON = dataBuffer.toString();
        return JSON.parse(dataJSON);
    } catch (e) {
        return { dresses: [], makeup: [] };
    }
};

// Save inventory data to JSON file
const saveInventory = (inventory) => {
    const dataJSON = JSON.stringify(inventory, null, 2);
    fs.writeFileSync('inventory.json', dataJSON);
};

// Get all inventory items
app.get('/api/inventory', (req, res) => {
    const inventory = loadInventory();
    res.send(inventory);
});

// Add or update an inventory item
app.post('/api/inventory', (req, res) => {
    const inventory = loadInventory();
    const newItem = req.body;
    const { category } = newItem;

    if (!inventory[category]) {
        inventory[category] = [];
    }

    const existingItemIndex = inventory[category].findIndex(item => item.id === newItem.id);

    if (existingItemIndex > -1) {
        inventory[category][existingItemIndex] = newItem;
    } else {
        newItem.id = inventory[category].length ? Math.max(...inventory[category].map(item => item.id)) + 1 : 1;
        inventory[category].push(newItem);
    }

    saveInventory(inventory);
    res.send(newItem);
});

// Delete an inventory item
app.delete('/api/inventory/:category/:id', (req, res) => {
    const { category, id } = req.params;
    const inventory = loadInventory();

    if (inventory[category]) {
        inventory[category] = inventory[category].filter(item => item.id != id);
        saveInventory(inventory);
        res.send({ id });
    } else {
        res.status(404).send('Category not found');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
